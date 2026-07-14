import express from "express";
import { saveResponse } from "../controllers/response.controller.js";
import { flexibleProtect } from "../middlewares/auth.middleware.js";
import { getResponsesByAssessment } from "../controllers/response.controller.js";
import { exportIndividualReportExcel, exportOrganizationReportExcel } from "../controllers/response.controller.js";

const router = express.Router();

/**
 * @swagger
 * /api/v1/responses:
 *   post:
 *     summary: Save or update assessment responses (autosave)
 *     description: Saves or upserts a batch of question responses for an assessment. This endpoint is used for autosave during an in-progress assessment.
 *     tags:
 *       - Responses
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - responses
 *             properties:
 *               responses:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - assessmentId
 *                     - questionId
 *                     - questionCode
 *                     - answer
 *                   properties:
 *                     assessmentId:
 *                       type: string
 *                       example: 60d21b4667d0d8992e610c85
 *                     questionId:
 *                       type: string
 *                       example: 60d21b4667d0d8992e610c86
 *                     questionCode:
 *                       type: string
 *                       example: Q-PP-01
 *                     answer:
 *                       oneOf:
 *                         - type: number
 *                           example: 4
 *                         - type: string
 *                           example: A
 *                     comment:
 *                       type: string
 *                       example: This is a comment for a low score
 *     responses:
 *       200:
 *         description: Responses saved successfully, returns saved response documents
 *       400:
 *         description: Invalid response data or missing required comment
 *       404:
 *         description: One or more questions not found
 *       500:
 *         description: Server error
 */
router.post("/", flexibleProtect, saveResponse);

/**
 * @swagger
 * /api/v1/responses/{assessmentId}:
 *   get:
 *     summary: Get responses for a specific assessment
 *     description: Returns responses for an assessment. First checks for a finalized SubmittedAssessment snapshot, then falls back to draft Response records.
 *     tags:
 *       - Responses
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assessmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Assessment ID
 *     responses:
 *       200:
 *         description: Responses returned successfully
 *       404:
 *         description: No responses found for this assessment
 *       500:
 *         description: Server error
 */
router.get("/:assessmentId", flexibleProtect, getResponsesByAssessment);

/**
 * @swagger
 * /api/v1/responses/{assessmentId}/export:
 *   get:
 *     summary: Export individual assessment report as Excel
 *     description: Generates and downloads a formatted Excel report for a specific assessment, including scores, domain breakdowns, and comments.
 *     tags:
 *       - Responses
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assessmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Assessment ID
 *     responses:
 *       200:
 *         description: Excel report file download
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Assessment not found
 *       500:
 *         description: Server error
 */
router.get("/:assessmentId/export", flexibleProtect, exportIndividualReportExcel);

/**
 * @swagger
 * /api/v1/responses/organization/{orgName}/export:
 *   get:
 *     summary: Export organization-wide assessment report as Excel
 *     description: Generates and downloads a formatted Excel report for all assessments within a specific organization.
 *     tags:
 *       - Responses
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orgName
 *         required: true
 *         schema:
 *           type: string
 *         description: Organization name
 *         example: Acme Corp
 *     responses:
 *       200:
 *         description: Excel report file download
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: No assessments found for this organization
 *       500:
 *         description: Server error
 */
router.get("/organization/:orgName/export", flexibleProtect, exportOrganizationReportExcel);

export default router;
