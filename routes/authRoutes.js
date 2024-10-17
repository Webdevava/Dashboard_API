const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// router.post("/register", authController.register);
// router.post("/login", authController.login);
// router.get("/verify/:token", authController.verifyEmail);

router.post("/register", authController.register);
router.post("/verify-otp", authController.verifyOTP);
router.post("/login", authController.login);
router.post("/resend-otp", authController.resendOTP); // New route for resending OTP

module.exports = router;
