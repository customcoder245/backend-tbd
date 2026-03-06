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
  sendBulkInvitations,
  getInvitationDetails
} from "../controllers/invitation.controller.js";

import {
  getOrgDetails,
  getAllOrganizations,
  getOrgFilters
} from "../controllers/organization.controller.js";

import { getNotifications, markAsRead, markAllAsRead, clearNotifications } from "../controllers/notification.controller.js";
import { resendVerificationEmail } from "../controllers/resendVerification.controller.js";
import { protect, flexibleProtect } from "../middlewares/auth.middleware.js";
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
router.get("/invitation-details/:token", getInvitationDetails);

// User Routes
router.get("/me", flexibleProtect, getMe);
router.get("/my-profile", flexibleProtect, myProfile);
router.patch("/update-profile", protect, upload.fields([{ name: "profileImage", maxCount: 1 }, { name: "orgLogo", maxCount: 1 }]), updateProfile);

// Organization Routes
router.get("/organization/:orgName", protect, getOrgDetails);
router.get("/organizations", protect, getAllOrganizations);
router.get("/organization-filters/:orgName", protect, getOrgFilters);

// Notifications routes
router.get("/notifications", protect, getNotifications);
router.patch("/notifications/:id/read", protect, markAsRead);
router.patch("/notifications/read-all", protect, markAllAsRead);
router.delete("/notifications/clear-all", protect, clearNotifications);

// Preferences
import { updateNotificationPreferences } from "../controllers/preferences.controller.js";
router.patch("/update-notifications", protect, updateNotificationPreferences);

export default router;
