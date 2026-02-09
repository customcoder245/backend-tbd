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
  sendInvitation,
  acceptInvitation,
  getCurrentUserSession,
  getInvitations,
  deleteInvitation,
  getMe,
  myProfile,
  updateProfile
} from "../controllers/auth.controller.js";

import { resendVerificationEmail } from "../controllers/resendVerification.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout); // 

router.get("/verify-email/:token", verifyEmail);
router.post("/complete-profile", completeProfile);

router.post("/forgot-password", forgotPassword);
router.get("/reset-password/:token", resetPasswordRedirect);
router.post("/reset-password", resetPassword);

router.post("/resend-verification-email", resendVerificationEmail);

router.post("/send-invitation", protect, sendInvitation);
router.get("/invite/:token", acceptInvitation);

router.get("/current-user-session", getCurrentUserSession);

router.get("/invitations", protect, getInvitations);
router.delete("/invitation/:id", protect, deleteInvitation);

router.get("/me", protect, getMe);
router.get("/my-profile", protect, myProfile);
router.patch("/update-profile", protect, upload.single("profileImage"), updateProfile);

export default router;
