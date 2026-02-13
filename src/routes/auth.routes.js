import express from "express";
import {
  register,
  login,
  logout,
  verifyEmail,
  completeProfile,
  forgotPassword,
  resetPassword,
  resetPasswordRedirect,
  getCurrentUserSession,
  changePassword
} from "../controllers/auth.controller.js";

import {
  getMe,
  myProfile,
  updateProfile
} from "../controllers/user.controller.js";

import {
  sendInvitation,
  acceptInvitation,
  getInvitations,
  deleteInvitation,
  sendBulkInvitations
} from "../controllers/invitation.controller.js";

import { getOrgDetails } from "../controllers/organization.controller.js";

import { getNotifications, markAsRead, markAllAsRead, clearNotifications } from "../controllers/notification.controller.js";
import { resendVerificationEmail } from "../controllers/resendVerification.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { uploadCSV } from "../middlewares/csvUpload.middleware.js";

const router = express.Router();

// Core Auth Routes
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/verify-email/:token", verifyEmail);
router.post("/complete-profile", completeProfile);
router.post("/forgot-password", forgotPassword);
router.get("/reset-password/:token", resetPasswordRedirect);
router.post("/reset-password", resetPassword);
router.post("/change-password", protect, changePassword);
router.post("/resend-verification-email", resendVerificationEmail);
router.get("/current-user-session", getCurrentUserSession);

// Invitation Routes
router.post("/send-invitation", protect, sendInvitation);
router.get("/invite/:token", acceptInvitation);
router.get("/invitations", protect, getInvitations);
router.delete("/invitation/:id", protect, deleteInvitation);
router.post("/send-bulk-invitation", protect, uploadCSV, sendBulkInvitations);

// User Routes
router.get("/me", protect, getMe);
router.get("/my-profile", protect, myProfile);
router.patch("/update-profile", protect, upload.single("profileImage"), updateProfile);

// Organization Routes
router.get("/organization/:orgName", protect, getOrgDetails);

// Notifications routes
router.get("/notifications", protect, getNotifications);
router.patch("/notifications/:id/read", protect, markAsRead);
router.patch("/notifications/read-all", protect, markAllAsRead);
router.delete("/notifications/clear-all", protect, clearNotifications);

// Preferences
import { updateNotificationPreferences } from "../controllers/preferences.controller.js";
router.patch("/update-notifications", protect, updateNotificationPreferences);

export default router;
