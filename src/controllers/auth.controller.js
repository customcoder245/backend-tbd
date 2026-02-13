import User from "../models/user.model.js";
import Invitation from "../models/invitation.model.js";
import Assessment from "../models/assessment.model.js";
import { sendVerificationEmail, sendResetEmail } from "../utils/sendEmail.js";
import jwt from "jsonwebtoken";
import { createNotification, notifySuperAdmins } from "../utils/notification.utils.js";

// ================= REGISTER =================
export const register = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const invitationTokenFromUrl = req.query.token;
    const invitationTokenFromCookie = req.cookies.invitationToken;
    const invitationToken = invitationTokenFromUrl || invitationTokenFromCookie;

    const query = invitationToken
      ? { $or: [{ token: invitationToken }, { token1: invitationToken }] }
      : { email, used: false };

    const invitation = await Invitation.findOne(query);

    if (!invitation) {
      return res.status(400).json({ message: "You are not invited yet, so you cannot register." });
    }

    if (invitation.used) {
      return res.status(400).json({ message: "Invitation already used." });
    }

    if (new Date(invitation.expiredAt) < new Date()) {
      return res.status(400).json({ message: "Invitation token expired." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists." });
    }

    const verificationToken = Math.random().toString(36).substring(2, 15);

    const user = new User({
      email,
      password,
      role: invitation.role,
      orgName: invitation.orgName,
      invitedBy: invitation.invitedBy || invitation.adminId,
      adminId: invitation.adminId,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000,
      invitationToken: invitationToken,
    });

    await user.save();

    const baseUrl = process.env.BACKEND_URL.endsWith("/")
      ? process.env.BACKEND_URL
      : `${process.env.BACKEND_URL}/`;

    const verificationLink = `${baseUrl}auth/verify-email/${verificationToken}`;

    await sendVerificationEmail({ email }, verificationLink);

    res.status(201).json({
      message: "Registration successful. Please verify your email.",
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Registration failed." });
  }
};

// ==================== Verify Email ====================
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=invalid_token`);
    }

    user.isEmailVerified = true;
    await user.save();

    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("verifyToken", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 15 * 60 * 1000,
    });

    const frontendUrl = process.env.FRONTEND_URL.endsWith("/")
      ? process.env.FRONTEND_URL.slice(0, -1)
      : process.env.FRONTEND_URL;

    res.redirect(`${frontendUrl}/after-register?verifyToken=${token}`);
  } catch (error) {
    console.error("Email verification error:", error);
    res.redirect(`${process.env.FRONTEND_URL}/login`);
  }
};

// ==================== Complete Profile ====================
export const completeProfile = async (req, res) => {
  try {
    const tokenFromCookie = req.cookies.verifyToken || req.headers["x-verify-token"];
    const { firstName, lastName, department, titles, orgName } = req.body;

    if (!tokenFromCookie) {
      return res.status(401).json({ message: "Verification session expired." });
    }

    const user = await User.findOne({ emailVerificationToken: tokenFromCookie });

    if (!user) {
      return res.status(400).json({ message: "Invalid token or profile already completed." });
    }

    if (user.role === "admin") {
      if (!orgName) return res.status(400).json({ message: "Organization name is required for Admins." });
      user.orgName = orgName;
    } else {
      const inviter = await User.findById(user.invitedBy || user.adminId);
      if (inviter) {
        user.orgName = inviter.orgName;
      }
    }

    user.firstName = firstName;
    user.lastName = lastName;
    user.department = department;
    user.titles = titles;
    user.profileCompleted = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;

    await user.save();

    const invitation = await Invitation.findOne({ email: user.email });
    if (invitation) {
      invitation.used = true;
      await invitation.save();

      await createNotification({
        recipient: invitation.invitedBy || invitation.adminId,
        title: "Team Member Joined",
        message: `${user.firstName} ${user.lastName} has accepted your invitation for ${user.orgName} and joined the platform.`,
        type: "success"
      });
    }

    await notifySuperAdmins({
      title: "New User Registered",
      message: `${user.firstName} ${user.lastName} has joined as ${user.role} for ${user.orgName}.`,
      type: "info"
    });

    const isProduction = process.env.NODE_ENV === "production";
    res.clearCookie("verifyToken", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/"
    });

    res.status(200).json({ message: "Profile completed successfully!" });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Organization name already exists." });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

// ==================== GET Current User Session ====================
export const getCurrentUserSession = async (req, res) => {
  try {
    const token = req.cookies.verifyToken || req.headers["x-verify-token"];
    if (!token) {
      return res.status(401).json({ message: "No verification session found" });
    }

    const user = await User.findOne({ emailVerificationToken: token });
    if (!user) {
      return res.status(401).json({ message: "Invalid verification session" });
    }

    let inheritedOrgName = "";
    if (user.role !== "admin") {
      const inviter = await User.findById(user.invitedBy || user.adminId);
      if (inviter) {
        inheritedOrgName = inviter.orgName;
      }
    }

    res.status(200).json({
      email: user.email,
      role: user.role,
      inheritedOrgName: inheritedOrgName
    });
  } catch (error) {
    console.error("getCurrentUserSession error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= LOGIN =================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!user.isEmailVerified) {
      return res.status(401).json({ message: "Please verify your email first" });
    }

    if (user.password !== password) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const accessToken = jwt.sign(
      { userId: user._id, role: user.role, orgName: user.orgName },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    const isProduction = process.env.NODE_ENV === "production";
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000,
      path: "/",
    };

    res.cookie("accessToken", accessToken, cookieOptions);

    res.status(200).json({
      message: "Login successful",
      user: {
        _id: user._id,
        email: user.email,
        role: user.role,
        orgName: user.orgName,
        profileCompleted: user.profileCompleted,
      },
      accessToken,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed" });
  }
};

// ================= FORGOT PASSWORD =================
export const forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.json({ message: "If exists, email sent" });
    }

    const token = Math.random().toString(36).substring(2, 15);

    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
    await user.save();

    const baseUrl = process.env.BACKEND_URL.endsWith('/')
      ? process.env.BACKEND_URL
      : `${process.env.BACKEND_URL}/`;

    const link = `${baseUrl}auth/reset-password/${token}`;
    await sendResetEmail(user.email, link);

    res.json({ message: "If exists, email sent" });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= RESET PASSWORD REDIRECT =================
export const resetPasswordRedirect = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.redirect(`${process.env.FRONTEND_URL}/login`);
    }

    res.setHeader("Cache-Control", "no-store");

    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("resetToken", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 15 * 60 * 1000
    });

    const frontendUrl = process.env.FRONTEND_URL.endsWith('/')
      ? process.env.FRONTEND_URL.slice(0, -1)
      : process.env.FRONTEND_URL;

    res.redirect(`${frontendUrl}/new-password`);
  } catch (error) {
    console.error("Reset password redirect error:", error);
    res.redirect(`${process.env.FRONTEND_URL}/login`);
  }
};

// ================= RESET PASSWORD =================
export const resetPassword = async (req, res) => {
  try {
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
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= CHANGE PASSWORD =================
export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user.userId;

    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "New passwords do not match" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.password !== oldPassword) {
      return res.status(400).json({ message: "Incorrect current password" });
    }

    if (user.password === newPassword) {
      return res.status(400).json({ message: "New password cannot be the same as current password" });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= LOGOUT =================
export const logout = async (req, res) => {
  try {
    const isProduction = process.env.NODE_ENV === "production";
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/",
    };

    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("user", cookieOptions);
    res.clearCookie("verifyToken", cookieOptions);
    res.clearCookie("resetToken", cookieOptions);

    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    return res.status(200).json({
      message: "Logged out successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Logout failed",
    });
  }
};
