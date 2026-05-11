const bcrypt = require("bcryptjs");
const Employee = require("../models/Employee");
const User = require("../models/User");
const { parsePagination, buildPaginationMeta } = require("../utils/pagination");

const addEmployee = async (req, res) => {
  try {
    const { name, email, password, employeeId, department, designation, phone, joiningDate } =
      req.body;

    if (!name || !email || !password || !employeeId || !department || !designation || !joiningDate) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const existingEmployee = await Employee.findOne({ employeeId });
    if (existingEmployee) {
      return res.status(400).json({ message: "Employee ID already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "employee",
    });

    const employee = await Employee.create({
      user: user._id,
      employeeId,
      department,
      designation,
      phone,
      joiningDate,
    });

    return res.status(201).json({
      message: "Employee added successfully",
      employee,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to add employee", error: error.message });
  }
};

const listEmployees = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const sortBy = req.query.sortBy || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
    const search = (req.query.search || "").trim();

    const filter = {};

    if (search) {
      const searchRegex = new RegExp(search, "i");
      const matchedUsers = await User.find({
        $or: [{ name: searchRegex }, { email: searchRegex }],
      }).select("_id");

      const userIds = matchedUsers.map((user) => user._id);

      filter.$or = [
        { employeeId: searchRegex },
        { department: searchRegex },
        { designation: searchRegex },
        { user: { $in: userIds } },
      ];
    }

    const [employees, total] = await Promise.all([
      Employee.find(filter)
      .populate("user", "name email role")
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit),
      Employee.countDocuments(filter),
    ]);

    return res.json({
      data: employees,
      pagination: buildPaginationMeta({ total, page, limit }),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch employees" });
  }
};

const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, department, designation, phone, joiningDate } = req.body;

    const employee = await Employee.findById(id).populate("user");
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    if (name) {
      employee.user.name = name;
    }

    if (email) {
      const normalizedEmail = email.toLowerCase();
      const existingUser = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: employee.user._id },
      });

      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }

      employee.user.email = normalizedEmail;
    }

    if (department) {
      employee.department = department;
    }

    if (designation) {
      employee.designation = designation;
    }

    if (phone !== undefined) {
      employee.phone = phone;
    }

    if (joiningDate) {
      employee.joiningDate = joiningDate;
    }

    await employee.user.save();
    await employee.save();

    const updatedEmployee = await Employee.findById(id).populate("user", "name email role");

    return res.json({
      message: "Employee updated successfully",
      employee: updatedEmployee,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update employee", error: error.message });
  }
};

const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    await User.findByIdAndDelete(employee.user);
    await employee.deleteOne();

    return res.json({ message: "Employee deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete employee", error: error.message });
  }
};

module.exports = {
  addEmployee,
  listEmployees,
  updateEmployee,
  deleteEmployee,
};
