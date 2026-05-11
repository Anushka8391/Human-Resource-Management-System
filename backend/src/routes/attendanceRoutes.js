const express = require("express");
const {
  markAttendance,
  getAttendanceRecords,
} = require("../controllers/attendanceController");
const { protect } = require("../middleware/authMiddleware");
const { validateRequest } = require("../middleware/validationMiddleware");
const {
  markAttendanceValidation,
  attendanceListValidation,
} = require("../validators/attendanceValidators");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);

router.post(
  "/mark",
  authorizeRoles("admin"),
  markAttendanceValidation,
  validateRequest,
  markAttendance
);
router.get("/records", attendanceListValidation, validateRequest, getAttendanceRecords);

module.exports = router;
