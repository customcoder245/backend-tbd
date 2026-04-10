import { Router } from "express";
import { protect, restrictTo } from "../middlewares/auth.middleware.js";
import {
  getOrganizationDepartments,
  addDepartment,
  removeDepartment
} from "../controllers/organization.controller.js";

const router = Router();

router.get("/departments", protect, getOrganizationDepartments);
router.post("/departments", protect, restrictTo("admin"), addDepartment);
router.delete("/departments", protect, restrictTo("admin"), removeDepartment);

export default router;
