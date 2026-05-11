const express = require("express");
const {
  addEmployee,
  listEmployees,
  updateEmployee,
  deleteEmployee,
} = require("../controllers/employeeController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const { validateRequest } = require("../middleware/validationMiddleware");
const {
  employeeCreateValidation,
  employeeUpdateValidation,
  employeeListValidation,
  objectIdParamValidation,
} = require("../validators/employeeValidators");

const router = express.Router();

router.use(protect);

router
  .route("/")
  .post(authorizeRoles("admin"), employeeCreateValidation, validateRequest, addEmployee)
  .get(authorizeRoles("admin"), employeeListValidation, validateRequest, listEmployees);

router
  .route("/:id")
  .put(authorizeRoles("admin"), employeeUpdateValidation, validateRequest, updateEmployee)
  .delete(authorizeRoles("admin"), objectIdParamValidation, validateRequest, deleteEmployee);

module.exports = router;
