import express from "express";
import {
  startAssessment,
  submitAssessment
} from "../controllers/assessment.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * START assessment (create draft)
 */
router.post("/start", protect, startAssessment);

/**
 * FINAL submission of assessment
 */
router.post("/:assessmentId/submit", protect, submitAssessment);

export default router;
