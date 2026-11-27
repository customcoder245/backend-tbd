import { Router } from "express";
import { flexibleProtect } from "../middlewares/auth.middleware.js";
import {
  getBenefitsRealization,
  updateActiveCheckpoint,
  updateScorecardDriver,
  updateNeedsAttention,
  updateGovernanceConfig,
  exportBenefitsExcel,
  exportBenefitsPptx
} from "../controllers/benefitsRealization.controller.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Benefits Realization
 *   description: Executive strategic scorecard, Stage-Gate checkpoints, and realized outcomes APIs
 */

/**
 * @swagger
 * /api/v1/benefits/export-excel:
 *   get:
 *     summary: Export dynamic 5-sheet Excel scorecard (.xlsx)
 *     tags: [Benefits Realization]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: orgName
 *         schema:
 *           type: string
 *         description: Organization name (default Langara College)
 *     responses:
 *       200:
 *         description: Excel spreadsheet binary stream
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get("/export-excel", flexibleProtect, exportBenefitsExcel);

/**
 * @swagger
 * /api/v1/benefits/export-pptx:
 *   get:
 *     summary: Export dynamic 11-slide PowerPoint presentation (.pptx) injected with live MongoDB metrics
 *     tags: [Benefits Realization]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: orgName
 *         schema:
 *           type: string
 *         description: Organization name (default Langara College)
 *     responses:
 *       200:
 *         description: PowerPoint presentation binary stream
 *         content:
 *           application/vnd.openxmlformats-officedocument.presentationml.presentation:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get("/export-pptx", flexibleProtect, exportBenefitsPptx);

/**
 * @swagger
 * /api/v1/benefits:
 *   get:
 *     summary: Retrieve Benefits Realization record for an organization
 *     tags: [Benefits Realization]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: orgName
 *         schema:
 *           type: string
 *         description: Target organization name
 *     responses:
 *       200:
 *         description: Benefits Realization data
 */
router.get("/", flexibleProtect, getBenefitsRealization);

/**
 * @swagger
 * /api/v1/benefits/checkpoint:
 *   put:
 *     summary: Advance or set active review gate checkpoint (1 - 5)
 *     tags: [Benefits Realization]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - checkpointNumber
 *             properties:
 *               orgName:
 *                 type: string
 *               checkpointNumber:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *     responses:
 *       200:
 *         description: Updated checkpoint state
 */
router.put("/checkpoint", flexibleProtect, updateActiveCheckpoint);

/**
 * @swagger
 * /api/v1/benefits/scorecard:
 *   put:
 *     summary: Update specific strategic scorecard driver (B1 - B9)
 *     tags: [Benefits Realization]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - driverId
 *               - score
 *             properties:
 *               orgName:
 *                 type: string
 *               driverId:
 *                 type: string
 *                 example: B1
 *               score:
 *                 type: number
 *                 example: 4.2
 *               status:
 *                 type: string
 *                 enum: [On Track, Monitor, Progressing, Verified]
 *               evidence:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated scorecard driver
 */
router.put("/scorecard", flexibleProtect, updateScorecardDriver);

/**
 * @swagger
 * /api/v1/benefits/needs-attention:
 *   put:
 *     summary: Update needs attention recommendations / action items
 *     tags: [Benefits Realization]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               orgName:
 *                 type: string
 *               id:
 *                 type: string
 *                 example: NA-1
 *               recommendation:
 *                 type: string
 *               severity:
 *                 type: string
 *               healthStatus:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated needs attention action item
 */
router.put("/needs-attention", flexibleProtect, updateNeedsAttention);

/**
 * @swagger
 * /api/v1/benefits/governance-config:
 *   put:
 *     summary: Update centralized governance configuration, scoring methodology and RAG thresholds
 *     tags: [Benefits Realization]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orgName:
 *                 type: string
 *               governanceConfig:
 *                 type: object
 *     responses:
 *       200:
 *         description: Updated governance configuration
 */
router.put("/governance-config", flexibleProtect, updateGovernanceConfig);

export default router;
