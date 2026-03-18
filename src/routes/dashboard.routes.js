import express from "express";
import {
    employeeReport,
    managerReport,
    LeaderReport,
    AdminReport,
    getDomainDetailedReport,
    updateDomainDetailedReport
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

export default router;
