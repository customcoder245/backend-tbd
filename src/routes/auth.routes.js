import express from "express";
import {
  register,
  login,
  verifyEmail,
  completeProfile,
  forgotPassword,
  resetPassword,
  resetPasswordRedirect,
  sendInvitation, 
  acceptInvitation
} from "../controllers/auth.controller.js";

import { resendVerificationEmail } from "../controllers/resendVerification.controller.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

router.get("/verify-email/:token", verifyEmail);
router.post("/complete-profile", completeProfile);

router.post("/forgot-password", forgotPassword);
router.get("/reset-password/:token", resetPasswordRedirect);
router.post("/reset-password", resetPassword);

router.post("/resend-verification-email", resendVerificationEmail);

router.post("/send-invitation", sendInvitation);
router.get("/invite/:token", acceptInvitation);

export default router;

