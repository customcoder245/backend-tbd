import User from "../models/user.model.js";
import { sendVerificationEmail, sendResetEmail } from "../utils/sendEmail.js";
import jwt from "jsonwebtoken";

/* ================= REGISTER ================= */
export const register = async (req, res) => {
  const { email, password, confirmPassword } = req.body;

  if (!email || !password || !confirmPassword) {
    return res.status(400).json({ message: "All fields required" });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      message: "Email already registered. Please verify your email."
    });
  }

  const token = jwt.sign({ email }, process.env.JWT_SECRET, {
    expiresIn: "15m"
  });

  const user = await User.create({
    email,
    password, // ⚠️ hash later
    emailVerificationToken: token,
    emailVerificationExpires: Date.now() + 15 * 60 * 1000,
    isEmailVerified: false,
    profileCompleted: false
  });

  // ✅ EMAIL MUST HIT BACKEND
  const link = `${process.env.BACKEND_URL}/api/v1/auth/verify-email/${token}`;  
  await sendVerificationEmail(user, link);

  res.status(201).json({ message: "Verification email sent" });
};

/* ================= VERIFY EMAIL (COOKIE + REDIRECT) ================= */
export const verifyEmail = async (req, res) => {
  const { token } = req.params;

  const user = await User.findOne({
    emailVerificationToken: token,
    emailVerificationExpires: { $gt: Date.now() }
  });

  if (!user) {
    return res.redirect(`${process.env.FRONTEND_URL}/login`);
  }

  user.isEmailVerified = true;
  await user.save();

  // ✅ STORE TOKEN SECURELY
  res.cookie("verifyToken", token, {
    httpOnly: true,
    secure: false, // true in production (https)
    maxAge: 15 * 60 * 1000
  });

  // ✅ REDIRECT WITHOUT TOKEN
  res.redirect(`${process.env.FRONTEND_URL}/profile-info`);
};

/* ================= COMPLETE PROFILE ================= */
export const completeProfile = async (req, res) => {
  const token = req.cookies.verifyToken;
  const { firstName, lastName, department, initials, role } = req.body;

  if (!token) {
    return res.status(400).json({ message: "Verification expired" });
  }

  const user = await User.findOne({
    emailVerificationToken: token,
    emailVerificationExpires: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).json({ message: "Invalid token" });
  }

  user.firstName = firstName;
  user.lastName = lastName;
  user.department = department;
  user.initials = initials;
  user.role = role;
  user.profileCompleted = true;

  user.emailVerificationToken = null;
  user.emailVerificationExpires = null;

  await user.save();

  res.clearCookie("verifyToken");
  res.json({ message: "Profile completed successfully" });
};

/* ================= LOGIN ================= */
export const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user || user.password !== password) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  if (!user.isEmailVerified) {
    return res.status(403).json({ message: "Please verify your email first" });
  }

  if (!user.profileCompleted) {
    return res.status(403).json({ message: "Please complete your profile" });
  }

  const token = user.generateAccessToken();

  res.json({
    accessToken: token,
    user: {
      id: user._id,
      role: user.role
    }
  });
};

/* ================= FORGOT PASSWORD ================= */
export const forgotPassword = async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  // 🔒 security: same response always
  if (!user) {
    return res.json({ message: "If exists, email sent" });
  }

  const token = Math.random().toString(36).substring(2, 15);

  user.resetPasswordToken = token;
  user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
  await user.save();

  // ✅ BACKEND link (same pattern as register)
  const link = `${process.env.BACKEND_URL}/api/v1/auth/reset-password/${token}`;
  await sendResetEmail(user.email, link);

  res.json({ message: "If exists, email sent" });
};


/* ================= RESET PASSWORD REDIRECT ================= */
export const resetPasswordRedirect = async (req, res) => {
  const { token } = req.params;

  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) {
    return res.redirect(`${process.env.FRONTEND_URL}/login`);
  }

  // ✅ STORE TOKEN IN COOKIE
  res.cookie("resetToken", token, {
    httpOnly: true,
    secure: false, // true in production
    maxAge: 15 * 60 * 1000
  });

  // ✅ CLEAN FRONTEND URL (NO TOKEN)
  res.redirect(`${process.env.FRONTEND_URL}/new-password`);
};


export const resetPassword = async (req, res) => {
  const token = req.cookies.resetToken;
  const { password } = req.body;

  if (!token) {
    return res.status(400).json({ message: "Reset token expired" });
  }

  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).json({ message: "Invalid or expired token" });
  }

  user.password = password;
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  await user.save();

  res.clearCookie("resetToken");
  res.json({ message: "Password reset successful" });
};
