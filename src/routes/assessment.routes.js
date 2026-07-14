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
 * @swagger
 * /api/v1/assessment/start:
 *   get:
 *     summary: Get metadata for starting the assessment
 *     description: Returns assessment title, description, and standard duration.
 *     tags:
 *       - Assessment
 *     responses:
 *       200:
 *         description: Assessment start data retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 title:
 *                   type: string
 *                   example: "POD-360™ | From Friction to Flow"
 *                 description_one:
 *                   type: string
 *                   example: "Every organization experiences friction..."
 *                 description_two:
 *                   type: string
 *                   example: "is a confidential assessment..."
 *                 duration_minutes:
 *                   type: integer
 *                   example: 40
 */
router.get("/start", getAssessmentStartData);

/**
 * @swagger
 * /api/v1/assessment/start:
 *   post:
 *     summary: Start a new or resume an existing assessment draft
 *     description: Creates a draft assessment record or returns an existing incomplete draft for the current cycle.
 *     tags:
 *       - Assessment
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - stakeholder
 *             properties:
 *               stakeholder:
 *                 type: string
 *                 description: Type of stakeholder taking the assessment
 *                 example: employee
 *     responses:
 *       201:
 *         description: New assessment draft created.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: New assessment started
 *                 assessmentId:
 *                   type: string
 *                   example: 60d21b4667d0d8992e610c85
 *       200:
 *         description: Resuming an existing incomplete assessment draft.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Resuming existing assessment
 *                 assessmentId:
 *                   type: string
 *                   example: 60d21b4667d0d8992e610c85
 *       403:
 *         description: Assessment not due yet OR user is an admin (forbidden to take assessments).
 *       404:
 *         description: User not found.
 *       500:
 *         description: Server error.
 */
router.post("/start", protect, startAssessment);

/**
 * @swagger
 * /api/v1/assessment/{assessmentId}/submit:
 *   post:
 *     summary: Final submission of an assessment
 *     description: Calculates scores, triggers feedback calculations, and completes the assessment.
 *     tags:
 *       - Assessment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assessmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the assessment to submit
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *               department:
 *                 type: string
 *                 example: Engineering
 *     responses:
 *       200:
 *         description: Assessment submitted successfully.
 *       400:
 *         description: Already completed or no responses recorded.
 *       404:
 *         description: Assessment or User not found.
 *       500:
 *         description: Submission failed.
 */
router.post("/:assessmentId/submit", protect, submitAssessment);

/**
 * @swagger
 * /api/v1/assessment/history:
 *   get:
 *     summary: Get assessment history for current user
 *     description: Returns all assessments (completed and in-progress) for the authenticated user, sorted by most recent.
 *     tags:
 *       - Assessment
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of assessments returned
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   stakeholder:
 *                     type: string
 *                   isCompleted:
 *                     type: boolean
 *                   submittedAt:
 *                     type: string
 *                     format: date-time
 *                   orgName:
 *                     type: string
 *       401:
 *         description: Unauthorized
 */
router.get("/history", protect, getMyAssessments);

/**
 * @swagger
 * /api/v1/assessment/super-admin/stats:
 *   get:
 *     summary: Get super admin assessment stats
 *     description: Returns organization-level assessment statistics for the super admin dashboard, including completion counts, participation rates, and org breakdown.
 *     tags:
 *       - Assessment
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Super admin stats returned
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get("/super-admin/stats", protect, getSuperAdminStats);

/**
 * @swagger
 * /api/v1/assessment/super-admin/intelligence:
 *   get:
 *     summary: Get super admin intelligence report
 *     description: Returns detailed cross-organization intelligence data including domain averages, trends, and comparison metrics for super admin use.
 *     tags:
 *       - Assessment
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Super admin intelligence data returned
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get("/super-admin/intelligence", protect, getSuperAdminIntelligence);

/**
 * @swagger
 * /api/v1/assessment/admin/intelligence:
 *   get:
 *     summary: Get admin intelligence report
 *     description: Returns aggregated intelligence data for the admin's organization, including domain averages, trends, and department breakdown.
 *     tags:
 *       - Assessment
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin intelligence data returned
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin access only
 */
router.get("/admin/intelligence", protect, getAdminIntelligence);

/**
 * @swagger
 * /api/v1/assessment/leader/intelligence:
 *   get:
 *     summary: Get leader intelligence report
 *     description: Returns intelligence data aggregated for the leader's scope, including team domain averages, trends, and comparison data.
 *     tags:
 *       - Assessment
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Leader intelligence data returned
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - leader access only
 */
router.get("/leader/intelligence", protect, getLeaderIntelligence);

/**
 * @swagger
 * /api/v1/assessment/manager/intelligence:
 *   get:
 *     summary: Get manager intelligence report
 *     description: Returns intelligence data for the manager's team, including team domain scores, trends, and individual comparison breakdowns.
 *     tags:
 *       - Assessment
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Manager intelligence data returned
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - manager access only
 */
router.get("/manager/intelligence", protect, getManagerIntelligence);

export default router;
