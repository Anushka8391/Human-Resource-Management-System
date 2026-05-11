const Attendance = require("../models/Attendance");
const Employee = require("../models/Employee");
const { parsePagination, buildPaginationMeta } = require("../utils/pagination");

const getServerLocalDateString = () => {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  const day = String(currentDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const markAttendance = async (req, res) => {
  try {
    const { employeeId, status } = req.body;

    const targetDate = getServerLocalDateString();

    let employee;

    if (req.user.role === "employee") {
      employee = await Employee.findOne({ user: req.user._id });
    } else {
      if (!employeeId) {
        return res.status(400).json({ message: "employeeId is required for admin" });
      }
      employee = await Employee.findById(employeeId);
    }

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const attendance = await Attendance.findOneAndUpdate(
      { employee: employee._id, date: targetDate },
      {
        employee: employee._id,
        date: targetDate,
        status: status || "present",
        markedBy: req.user._id,
      },
      { new: true, upsert: true, runValidators: true }
    ).populate({
      path: "employee",
      populate: { path: "user", select: "name email" },
    });

    return res.json({ message: "Attendance marked", attendance });
  } catch (error) {
    return res.status(500).json({ message: "Failed to mark attendance", error: error.message });
  }
};

const getAttendanceRecords = async (req, res) => {
  try {
    const { fromDate, toDate, status } = req.query;
    const { page, limit, skip } = parsePagination(req.query);

    const filter = {};

    if (fromDate || toDate) {
      filter.date = {};
      if (fromDate) {
        filter.date.$gte = fromDate;
      }
      if (toDate) {
        filter.date.$lte = toDate;
      }
    }

    if (status) {
      filter.status = status;
    }

    if (req.user.role === "employee") {
      const employee = await Employee.findOne({ user: req.user._id });
      if (!employee) {
        return res.status(404).json({ message: "Employee profile not found" });
      }
      filter.employee = employee._id;
    }

    const [records, total] = await Promise.all([
      Attendance.find(filter)
        .populate({
          path: "employee",
          populate: { path: "user", select: "name email" },
        })
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit),
      Attendance.countDocuments(filter),
    ]);

    return res.json({
      data: records,
      pagination: buildPaginationMeta({ total, page, limit }),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch attendance records" });
  }
};

module.exports = {
  markAttendance,
  getAttendanceRecords,
};
