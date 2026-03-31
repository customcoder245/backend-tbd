import express from "express";
import {
  startAssessment,
  submitAssessment,
  getAssessmentStartData,
  getMyAssessments,
  getSuperAdminStats,
  getSuperAdminIntelligence,
  getAdminIntelligence,
  getLeaderIntelligence,
  getManagerIntelligence
} from "../controllers/assessment.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * START assessment (create draft)
 */
router.get("/start", getAssessmentStartData);

router.post("/start", protect, startAssessment);

/**
 * FINAL submission of assessment
 */
router.post("/:assessmentId/submit", protect, submitAssessment);

/**
 * Get My Assessment History
 */
router.get("/history", protect, getMyAssessments);

/**
 * Super Admin Stats
 */
router.get("/super-admin/stats", protect, getSuperAdminStats);
router.get("/super-admin/intelligence", protect, getSuperAdminIntelligence);

/**
 * Admin Intelligence
 */
router.get("/admin/intelligence", protect, getAdminIntelligence);

/**
 * Leader Intelligence
 */
router.get("/leader/intelligence", protect, getLeaderIntelligence);

/**
 * Manager Intelligence
 */
router.get("/manager/intelligence", protect, getManagerIntelligence);

export default router;
