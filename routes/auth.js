import express from "express";
import { registerUser, loginUser, verifyOtp } from "../controllers/auth.js";

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user and send OTP
// @access  Public
router.post("/register", registerUser);

// @route   POST /api/auth/verify-otp
// @desc    Verify user's email with OTP
// @access  Public
router.post("/verify-otp", verifyOtp);

// @route   POST /api/auth/login
// @desc    Authenticate user and get token
// @access  Public
router.post("/login", loginUser);

export default router;
