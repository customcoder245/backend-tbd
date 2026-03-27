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
    getManagerTeamAvg
} from "../controllers/dashboard.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

// All dashboard routes are protected
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

export default router;
