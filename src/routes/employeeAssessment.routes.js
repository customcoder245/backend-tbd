// routes/employeeAssessment.routes.js
import express from "express";
import {
  startEmployeeAssessment,
  submitEmployeeAssessment
} from "../controllers/employeeAssessment.controller.js";
import { employeeAccess } from "../middlewares/employee.middleware.js";

const router = express.Router();

/**
 * @swagger
 * /api/v1/employee-assessment/start:
 *   post:
 *     summary: Start a new employee assessment (token-based, no login required)
 *     description: Creates a new assessment for an invited employee using their invite token. Returns an existing assessment if one already exists for this invitation.
 *     tags:
 *       - Employee Assessment
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Employee assessment started successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Employee assessment started
 *                 assessmentId:
 *                   type: string
 *                   example: 60d21b4667d0d8992e610c85
 *       200:
 *         description: Assessment already started - returns existing assessment ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Assessment already started
 *                 assessmentId:
 *                   type: string
 *       400:
 *         description: Invalid invitation ID
 *       404:
 *         description: Employee information not found - invalid token
 *       500:
 *         description: Server error
 */
router.post("/start", employeeAccess, startEmployeeAssessment);

/**
 * @swagger
 * /api/v1/employee-assessment/{assessmentId}/submit/{token}:
 *   post:
 *     summary: Final submission of an employee assessment
 *     description: Submits the employee's assessment with their personal details, calculates scores, and stores the result. Requires a valid invite token in the URL.
 *     tags:
 *       - Employee Assessment
 *     parameters:
 *       - in: path
 *         name: assessmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the assessment to submit
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: The employee's invitation token (used for authentication)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - department
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: Jane
 *               lastName:
 *                 type: string
 *                 example: Smith
 *               email:
 *                 type: string
 *                 format: email
 *                 example: jane.smith@example.com
 *               department:
 *                 type: string
 *                 example: Marketing
 *     responses:
 *       200:
 *         description: Assessment submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Assessment submitted successfully
 *                 submittedAssessment:
 *                   type: object
 *       400:
 *         description: Assessment already submitted or no responses found
 *       404:
 *         description: Assessment not found
 *       500:
 *         description: Server error
 */
router.post("/:assessmentId/submit/:token", employeeAccess, submitEmployeeAssessment);

export default router;
