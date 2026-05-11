const { body, param, query } = require("express-validator");

const objectIdParamValidation = [
  param("id").isMongoId().withMessage("Invalid employee id"),
];

const employeeCreateValidation = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").trim().isEmail().withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("employeeId").trim().notEmpty().withMessage("Employee ID is required"),
  body("department").trim().notEmpty().withMessage("Department is required"),
  body("designation").trim().notEmpty().withMessage("Designation is required"),
  body("joiningDate").isISO8601().withMessage("joiningDate must be a valid date"),
  body("phone").optional().trim().isLength({ min: 6, max: 20 }).withMessage("Phone is invalid"),
];

const employeeUpdateValidation = [
  ...objectIdParamValidation,
  body("name").optional().trim().notEmpty().withMessage("Name cannot be empty"),
  body("email").optional().trim().isEmail().withMessage("Email must be valid"),
  body("department").optional().trim().notEmpty().withMessage("Department cannot be empty"),
  body("designation").optional().trim().notEmpty().withMessage("Designation cannot be empty"),
  body("joiningDate").optional().isISO8601().withMessage("joiningDate must be a valid date"),
  body("phone").optional().trim().isLength({ min: 6, max: 20 }).withMessage("Phone is invalid"),
];

const employeeListValidation = [
  query("page").optional().isInt({ min: 1 }).withMessage("page must be at least 1"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("limit must be between 1 and 100"),
  query("search").optional().trim(),
  query("sortBy").optional().isIn(["createdAt", "joiningDate", "employeeId"]).withMessage("Invalid sortBy"),
  query("sortOrder").optional().isIn(["asc", "desc"]).withMessage("sortOrder must be asc or desc"),
];

module.exports = {
  employeeCreateValidation,
  employeeUpdateValidation,
  employeeListValidation,
  objectIdParamValidation,
};
