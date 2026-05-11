const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Employee = require("../models/Employee");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  });
};

const findEmployeeProfile = async (user) => {
  if (user.role !== "employee") {
    return null;
  }

  return Employee.findOne({ user: user._id }).select(
    "_id employeeId department designation phone joiningDate"
  );
};

const buildAuthResponse = async (user) => {
  const employee = await findEmployeeProfile(user);

  return {
    token: generateToken(user._id),
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      employee: employee || null,
    },
  };
};

const seedAdmin = async () => {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    return;
  }

  const existingAdmin = await User.findOne({ email: adminEmail.toLowerCase() });
  if (existingAdmin) {
    return;
  }

  const password = await bcrypt.hash(adminPassword, 10);
  await User.create({
    name: "System Admin",
    email: adminEmail.toLowerCase(),
    password,
    role: "admin",
  });
};

const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (role && String(role).toLowerCase() !== String(user.role).toLowerCase()) {
      return res.status(403).json({
        message: `This account is not registered as ${String(role).toLowerCase()}`,
      });
    }

    return res.json(await buildAuthResponse(user));
  } catch (error) {
    return res.status(500).json({ message: "Login failed", error: error.message });
  }
};

const logout = async (_req, res) => {
  return res.json({ message: "Logout successful" });
};

const me = async (req, res) => {
  try {
    const employee = await findEmployeeProfile(req.user);

    return res.json({
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      employee: employee || null,
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch profile" });
  }
};

module.exports = {
  login,
  logout,
  me,
  seedAdmin,
};
