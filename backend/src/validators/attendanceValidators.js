const { body, query } = require("express-validator");

const markAttendanceValidation = [
  body("employeeId").optional().isMongoId().withMessage("employeeId must be a valid id"),
  body("status")
    .optional()
    .isIn(["present", "absent", "half-day"])
    .withMessage("status must be present, absent or half-day"),
];

const attendanceListValidation = [
  query("fromDate").optional().isISO8601().withMessage("fromDate must be valid"),
  query("toDate").optional().isISO8601().withMessage("toDate must be valid"),
  query("status")
    .optional()
    .isIn(["present", "absent", "half-day"])
    .withMessage("status must be present, absent or half-day"),
  query("page").optional().isInt({ min: 1 }).withMessage("page must be at least 1"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("limit must be between 1 and 100"),
];

module.exports = {
  markAttendanceValidation,
  attendanceListValidation,
};
