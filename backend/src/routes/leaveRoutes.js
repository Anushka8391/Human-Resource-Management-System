const express = require("express");
const {
  applyLeave,
  getLeaveRequests,
  reviewLeave,
} = require("../controllers/leaveController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const { validateRequest } = require("../middleware/validationMiddleware");
const {
  applyLeaveValidation,
  listLeaveValidation,
  reviewLeaveValidation,
} = require("../validators/leaveValidators");

const router = express.Router();

router.use(protect);

router.post(
  "/apply",
  authorizeRoles("employee"),
  applyLeaveValidation,
  validateRequest,
  applyLeave
);
router.get("/", listLeaveValidation, validateRequest, getLeaveRequests);
router.patch("/:id/review", authorizeRoles("admin"), reviewLeaveValidation, validateRequest, reviewLeave);

module.exports = router;
