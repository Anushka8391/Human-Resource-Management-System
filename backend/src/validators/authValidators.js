const { body } = require("express-validator");

const loginValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Email must be valid"),
  body("password").notEmpty().withMessage("Password is required"),
  body("role")
    .optional()
    .trim()
    .toLowerCase()
    .isIn(["admin", "employee"])
    .withMessage("Role must be admin or employee"),
];

module.exports = {
  loginValidation,
};
