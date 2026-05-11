const Employee = require("../models/Employee");
const Leave = require("../models/Leave");
const Attendance = require("../models/Attendance");

const getDashboardSummary = async (req, res) => {
  try {
    let employeeFilter = {};
    let attendanceFilter = {};
    let leaveFilter = {};
    let employeeProfile = null;
    const role = String(req.user.role || "").toLowerCase();

    if (role === "employee") {
      const employee = await Employee.findOne({ user: req.user._id }).populate(
        "user",
        "name email"
      );
      if (!employee) {
        return res.status(404).json({ message: "Employee profile not found" });
      }

      employeeFilter = { _id: employee._id };
      attendanceFilter = { employee: employee._id };
      leaveFilter = { employee: employee._id };
      employeeProfile = {
        employeeId: employee.employeeId,
        department: employee.department,
        designation: employee.designation,
        joiningDate: employee.joiningDate,
        name: employee.user?.name || req.user.name,
        email: employee.user?.email || req.user.email,
      };
    }

    const [employeeCount, totalLeaves, approvedLeaves, pendingLeaves, presentCount, absentCount] =
      await Promise.all([
        Employee.countDocuments(employeeFilter),
        Leave.countDocuments(leaveFilter),
        Leave.countDocuments({ ...leaveFilter, status: "approved" }),
        Leave.countDocuments({ ...leaveFilter, status: "pending" }),
        Attendance.countDocuments({ ...attendanceFilter, status: "present" }),
        Attendance.countDocuments({ ...attendanceFilter, status: "absent" }),
      ]);

    return res.json({
      role,
      employeeCount,
      employeeProfile,
      leaveSummary: {
        total: totalLeaves,
        approved: approvedLeaves,
        pending: pendingLeaves,
      },
      attendanceSummary: {
        present: presentCount,
        absent: absentCount,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch dashboard summary" });
  }
};

module.exports = {
  getDashboardSummary,
};
