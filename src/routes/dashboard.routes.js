import express from "express";
import {
    employeeReport,
    managerReport,
    LeaderReport,
    AdminReport,
    getDomainDetailedReport,
    updateDomainDetailedReport,
    releaseReport,
    exportPdfReport,
    previewPdfReport,
    getManagerTeamAvg,
    publicDownloadReport,
    getOrgAverageReport
} from "../controllers/dashboard.controller.js";
import { getTooltips, updateTooltip } from "../controllers/tooltip.controller.js";
import { protect, restrictTo } from "../middlewares/auth.middleware.js";

const router = express.Router();

// 🆕 PUBLIC ROUTES
/**
 * @swagger
 * /api/v1/dashboard/public-download:
 *   get:
 *     summary: Public report download endpoint
 *     description: Allows downloading a report using a signed public token. No authentication required.
 *     tags:
 *       - Dashboard
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Signed download token provided in the release email
 *     responses:
 *       200:
 *         description: Report returned successfully
 *       400:
 *         description: Missing or invalid token
 *       403:
 *         description: Report not yet released or token expired
 */
router.get("/public-download", publicDownloadReport);

/**
 * @swagger
 * /api/v1/dashboard/tooltips:
 *   get:
 *     summary: Get all tooltip content
 *     description: Returns all tooltip definitions used throughout the app. Public endpoint.
 *     tags:
 *       - Dashboard
 *     responses:
 *       200:
 *         description: Tooltips returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   key:
 *                     type: string
 *                   content:
 *                     type: string
 */
router.get("/tooltips", getTooltips);

// All other dashboard routes are protected
router.use(protect);

/**
 * @swagger
 * /api/v1/dashboard/employee:
 *   get:
 *     summary: Get employee dashboard report
 *     description: Returns the assessment scores, domain breakdowns, and feedback for the authenticated employee.
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Employee report returned successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No completed assessment found
 */
router.get("/employee", employeeReport);

/**
 * @swagger
 * /api/v1/dashboard/manager:
 *   get:
 *     summary: Get manager dashboard report
 *     description: Returns the manager's own assessment report along with aggregated team data.
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Manager report returned successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No completed assessment found
 */
router.get("/manager", managerReport);

/**
 * @swagger
 * /api/v1/dashboard/leader:
 *   get:
 *     summary: Get leader dashboard report
 *     description: Returns the leader's assessment report along with aggregated organization-level data.
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Leader report returned successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/leader", LeaderReport);

/**
 * @swagger
 * /api/v1/dashboard/admin:
 *   get:
 *     summary: Get admin dashboard report
 *     description: Returns organization-wide assessment summary stats, completion rates, and domain averages for the admin.
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin report returned
 *       401:
 *         description: Unauthorized
 */
router.get("/admin", AdminReport);

/**
 * @swagger
 * /api/v1/dashboard/org-average:
 *   get:
 *     summary: Get organization average report
 *     description: Returns averaged assessment scores across the entire organization for comparison purposes.
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Organization average data returned
 *       401:
 *         description: Unauthorized
 */
router.get("/org-average", getOrgAverageReport);

/**
 * @swagger
 * /api/v1/dashboard/detailed-insight:
 *   get:
 *     summary: Get detailed domain insight report
 *     description: Returns detailed per-domain analysis including AI-generated OKRs, insights, and recommendations for the authenticated user.
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Detailed domain report returned
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No report found
 */
router.get("/detailed-insight", getDomainDetailedReport);

/**
 * @swagger
 * /api/v1/dashboard/detailed-insight:
 *   put:
 *     summary: Update detailed domain insight report
 *     description: Allows admins or super admins to update the insights, OKRs, or recommendations in a domain report.
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               domains:
 *                 type: object
 *                 description: Updated domain insights object
 *     responses:
 *       200:
 *         description: Domain insight updated successfully
 *       401:
 *         description: Unauthorized
 */
router.put("/detailed-insight", updateDomainDetailedReport);

/**
 * @swagger
 * /api/v1/dashboard/export-pdf:
 *   get:
 *     summary: Export dashboard report as PDF
 *     description: Generates and downloads the user's assessment report as a styled PDF document.
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: PDF report file download
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: No report found
 *       500:
 *         description: PDF generation failed
 */
router.get("/export-pdf", exportPdfReport);

/**
 * @swagger
 * /api/v1/dashboard/preview-pdf-report:
 *   get:
 *     summary: Preview PDF report in browser
 *     description: Renders the PDF report inline for browser preview instead of downloading.
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: PDF rendered inline for preview
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: No report found
 */
router.get("/preview-pdf-report", previewPdfReport);

/**
 * @swagger
 * /api/v1/dashboard/release-report:
 *   put:
 *     summary: Release a report to a user (Super Admin only)
 *     description: Marks a report as released and sends the user a download link. Only accessible by super admins.
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - assessmentId
 *             properties:
 *               assessmentId:
 *                 type: string
 *                 example: 60d21b4667d0d8992e610c85
 *     responses:
 *       200:
 *         description: Report released successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - super admin access only
 */
router.put("/release-report", releaseReport);

/**
 * @swagger
 * /api/v1/dashboard/manager-team-avg:
 *   get:
 *     summary: Get manager's team average scores by subdomain
 *     description: Returns the real average scores per subdomain for all team members under the authenticated manager.
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Team average scores returned
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No team assessments found
 */
router.get("/manager-team-avg", getManagerTeamAvg);

/**
 * @swagger
 * /api/v1/dashboard/tooltips:
 *   put:
 *     summary: Update tooltip content (Super Admin only)
 *     description: Allows super admins to update the content of app tooltips.
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               key:
 *                 type: string
 *                 example: domain_people_potential
 *               content:
 *                 type: string
 *                 example: Updated tooltip text
 *     responses:
 *       200:
 *         description: Tooltip updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Super admin access only
 */
router.put("/tooltips", restrictTo("superadmin", "super_admin"), updateTooltip);

export default router;
