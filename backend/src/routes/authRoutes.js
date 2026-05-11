const express = require("express");
const { login, logout, me } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { loginLimiter } = require("../middleware/securityMiddleware");
const { validateRequest } = require("../middleware/validationMiddleware");
const { loginValidation } = require("../validators/authValidators");

const router = express.Router();

router.post("/login", loginLimiter, loginValidation, validateRequest, login);
router.post("/logout", protect, logout);
router.get("/me", protect, me);

module.exports = router;
