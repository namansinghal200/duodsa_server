import User from "../models/User.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendOtpEmail } from "../utils/mailer.js";

// --- Helper function to generate a JWT token ---
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// --- 1. REGISTER a new user ---
export const registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: "Please enter all fields" });
  }

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res
        .status(400)
        .json({ message: "User with this email already exists" });
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000; // Expires in 10 minutes

    const user = new User({
      username,
      email,
      password, // Password will be hashed by the pre-save middleware
      otp,
      otpExpires,
    });

    const savedUser = await user.save();

    // Send OTP email but don't wait for it to complete
    sendOtpEmail(savedUser.email, otp);

    res.status(201).json({
      message: `Registration successful! An OTP has been sent to ${savedUser.email}.`,
      email: savedUser.email,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// --- 2. VERIFY user's email with OTP ---
export const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Email is already verified." });
    }

    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.isVerified = true;
    user.otp = undefined; // Clear OTP fields
    user.otpExpires = undefined;
    await user.save({ validateBeforeSave: false });

    res
      .status(200)
      .json({ message: "Email verified successfully. You can now log in." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// --- 3. LOGIN an existing user ---
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.isVerified) {
      return res
        .status(401)
        .json({ message: "Email not verified. Please verify your OTP first." });
    }

    // Use the matchPassword method from the User model
    if (await user.matchPassword(password)) {
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};
