// routes/employeeAssessment.routes.js
import express from "express";
import {
  startEmployeeAssessment,
  submitEmployeeAssessment
} from "../controllers/employeeAssessment.controller.js";
import { employeeAccess } from "../middlewares/employee.middleware.js";

const router = express.Router();

/**
 * EMPLOYEE ONLY (NO LOGIN)
 * Token-based access
 */
router.post("/start", employeeAccess, startEmployeeAssessment);
router.post("/:assessmentId/submit/:token", employeeAccess, submitEmployeeAssessment);

export default router;
