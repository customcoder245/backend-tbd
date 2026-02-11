import express from "express";
import { saveResponse } from "../controllers/response.controller.js";
import { flexibleProtect } from "../middlewares/auth.middleware.js";
import { getResponsesByAssessment } from "../controllers/response.controller.js";

const router = express.Router();

/**
 * Save or update response
 */
router.post("/", flexibleProtect, saveResponse);
router.get("/:assessmentId", flexibleProtect, getResponsesByAssessment);

export default router;
