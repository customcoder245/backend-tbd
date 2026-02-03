import express from "express";
import { saveResponse } from "../controllers/response.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { getResponsesByAssessment } from "../controllers/response.controller.js";
import { employeeAccess } from "../middlewares/employee.middleware.js";

const router = express.Router();

/**
 * Save or update response
 */
router.post("/", employeeAccess, saveResponse);
router.get("/:assessmentId", employeeAccess, getResponsesByAssessment);

export default router;
