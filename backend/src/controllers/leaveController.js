const Leave = require("../models/Leave");
const Employee = require("../models/Employee");
const Attendance = require("../models/Attendance");
const { parsePagination, buildPaginationMeta } = require("../utils/pagination");

const getDatesBetween = (fromDate, toDate) => {
  const dates = [];
  const current = new Date(fromDate);
  const end = new Date(toDate);
  while (current <= end) {
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, "0");
    const day = String(current.getDate()).padStart(2, "0");
    dates.push(`${year}-${month}-${day}`);
    current.setDate(current.getDate() + 1);
  }
  return dates;
};

const isValidDateString = (value) => {
  if (!value || typeof value !== "string") {
    return false;
  }
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
};

const applyLeave = async (req, res) => {
  try {
    const { fromDate, toDate, reason, leaveType } = req.body;

    if (!fromDate || !toDate || !reason) {
      return res.status(400).json({ message: "fromDate, toDate and reason are required" });
    }

    if (!isValidDateString(fromDate) || !isValidDateString(toDate)) {
      return res.status(400).json({ message: "Invalid leave dates" });
    }

    if (new Date(fromDate) > new Date(toDate)) {
      return res.status(400).json({ message: "fromDate cannot be later than toDate" });
    }

    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(404).json({ message: "Employee profile not found" });
    }

    // Avoid duplicate or overlapping pending/approved leave windows.
    const overlappingLeave = await Leave.findOne({
      employee: employee._id,
      status: { $in: ["pending", "approved"] },
      fromDate: { $lte: toDate },
      toDate: { $gte: fromDate },
    });

    if (overlappingLeave) {
      return res.status(400).json({
        message: "An overlapping pending/approved leave request already exists",
      });
    }

    const leave = await Leave.create({
      employee: employee._id,
      fromDate,
      toDate,
      reason: reason.trim(),
      leaveType: leaveType || "full-day",
    });

    return res.status(201).json({ message: "Leave request submitted", leave });
  } catch (error) {
    return res.status(500).json({ message: "Failed to apply leave", error: error.message });
  }
};

const getLeaveRequests = async (req, res) => {
  try {
    const { status, fromDate, toDate } = req.query;
    const { page, limit, skip } = parsePagination(req.query);
    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (fromDate || toDate) {
      if (fromDate) {
        filter.toDate = { ...(filter.toDate || {}), $gte: fromDate };
      }
      if (toDate) {
        filter.fromDate = { ...(filter.fromDate || {}), $lte: toDate };
      }
    }

    if (req.user.role === "employee") {
      const employee = await Employee.findOne({ user: req.user._id });
      if (!employee) {
        return res.status(404).json({ message: "Employee profile not found" });
      }
      filter.employee = employee._id;
    }

    const [requests, total] = await Promise.all([
      Leave.find(filter)
        .populate({
          path: "employee",
          populate: { path: "user", select: "name email" },
        })
        .populate("reviewedBy", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Leave.countDocuments(filter),
    ]);

    return res.json({
      data: requests,
      pagination: buildPaginationMeta({ total, page, limit }),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch leave requests" });
  }
};

const reviewLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Status must be approved or rejected" });
    }

    const leave = await Leave.findById(id);
    if (!leave) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    if (leave.status !== "pending") {
      return res.status(400).json({ message: "Only pending leaves can be reviewed" });
    }

    leave.status = status;
    leave.reviewedBy = req.user._id;
    await leave.save();

    if (status === "approved") {
      const dates = getDatesBetween(leave.fromDate, leave.toDate);
      await Promise.all(
        dates.map((date) =>
          Attendance.findOneAndUpdate(
            { employee: leave.employee, date },
            { employee: leave.employee, date, status: "leave", markedBy: req.user._id },
            { upsert: true, new: true, runValidators: true }
          )
        )
      );
    }

    const updatedLeave = await Leave.findById(id)
      .populate({
        path: "employee",
        populate: { path: "user", select: "name email" },
      })
      .populate("reviewedBy", "name email");

    return res.json({ message: `Leave ${status}`, leave: updatedLeave });
  } catch (error) {
    return res.status(500).json({ message: "Failed to review leave", error: error.message });
  }
};

module.exports = {
  applyLeave,
  getLeaveRequests,
  reviewLeave,
};
