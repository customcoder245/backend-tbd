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
    publicDownloadReport
} from "../controllers/dashboard.controller.js";
import { getTooltips, updateTooltip } from "../controllers/tooltip.controller.js";
import { protect, restrictTo } from "../middlewares/auth.middleware.js";

const router = express.Router();

// 🆕 PUBLIC ROUTES (No Login Required)
router.get("/public-download", publicDownloadReport);

// All other dashboard routes are protected
router.use(protect);

router.get("/employee", employeeReport);
router.get("/manager", managerReport);
router.get("/leader", LeaderReport);
router.get("/admin", AdminReport);

// 🆕 Detailed Domain Analysis (Insights, OKRs, Recommendations)
router.get("/detailed-insight", getDomainDetailedReport);
router.put("/detailed-insight", updateDomainDetailedReport);
router.get("/export-pdf", exportPdfReport);
router.get("/preview-pdf-report", previewPdfReport);

// 🆕 Release Report (Super Admin Only)
router.put("/release-report", releaseReport);

// 🆕 Manager Team Average (real dept avg per subdomain)
router.get("/manager-team-avg", getManagerTeamAvg);

// 🆕 Tooltip routes
router.get("/tooltips", getTooltips);
router.put("/tooltips", restrictTo("superadmin", "super_admin"), updateTooltip);

export default router;
