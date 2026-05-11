const { body, param, query } = require("express-validator");

const applyLeaveValidation = [
  body("fromDate")
    .isISO8601()
    .withMessage("fromDate must be valid")
    .custom((value) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const from = new Date(value);
      from.setHours(0, 0, 0, 0);
      if (from < today) {
        throw new Error("From date cannot be a past date");
      }
      return true;
    }),
  body("toDate").isISO8601().withMessage("toDate must be valid"),
  body("reason")
    .trim()
    .notEmpty()
    .withMessage("Reason is required")
    .isLength({ min: 3, max: 250 })
    .withMessage("Reason must be between 3 and 250 characters"),
  body("leaveType")
    .optional()
    .isIn(["full-day", "half-day"])
    .withMessage("leaveType must be full-day or half-day"),
];

const listLeaveValidation = [
  query("status")
    .optional()
    .isIn(["pending", "approved", "rejected"])
    .withMessage("status must be pending, approved or rejected"),
  query("fromDate").optional().isISO8601().withMessage("fromDate must be valid"),
  query("toDate").optional().isISO8601().withMessage("toDate must be valid"),
  query("page").optional().isInt({ min: 1 }).withMessage("page must be at least 1"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("limit must be between 1 and 100"),
];

const reviewLeaveValidation = [
  param("id").isMongoId().withMessage("Invalid leave id"),
  body("status")
    .isIn(["approved", "rejected"])
    .withMessage("Status must be approved or rejected"),
];

module.exports = {
  applyLeaveValidation,
  listLeaveValidation,
  reviewLeaveValidation,
};
