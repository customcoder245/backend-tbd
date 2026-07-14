import { Router } from "express";
import { protect, restrictTo } from "../middlewares/auth.middleware.js";
import {
  getOrganizationDepartments,
  addDepartment,
  removeDepartment
} from "../controllers/organization.controller.js";

const router = Router();

/**
 * @swagger
 * /api/v1/organization/departments:
 *   get:
 *     summary: Get departments for the current user's organization
 *     description: Returns a list of all departments configured for the authenticated user's organization.
 *     tags:
 *       - Organization
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Departments returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 departments:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["Engineering", "Marketing", "Finance"]
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Organization not found
 */
router.get("/departments", protect, getOrganizationDepartments);

/**
 * @swagger
 * /api/v1/organization/departments:
 *   post:
 *     summary: Add a department to the organization (Admin only)
 *     description: Adds a new department to the current admin's organization. Only accessible by users with the admin role.
 *     tags:
 *       - Organization
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - department
 *             properties:
 *               department:
 *                 type: string
 *                 example: "Product Design"
 *     responses:
 *       200:
 *         description: Department added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Department added successfully
 *                 departments:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: Department already exists or invalid data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin access only
 */
router.post("/departments", protect, restrictTo("admin"), addDepartment);

/**
 * @swagger
 * /api/v1/organization/departments:
 *   delete:
 *     summary: Remove a department from the organization (Admin only)
 *     description: Removes an existing department from the current admin's organization. Only accessible by users with the admin role.
 *     tags:
 *       - Organization
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - department
 *             properties:
 *               department:
 *                 type: string
 *                 example: "Product Design"
 *     responses:
 *       200:
 *         description: Department removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Department removed successfully
 *                 departments:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: Department not found or invalid data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin access only
 */
router.delete("/departments", protect, restrictTo("admin"), removeDepartment);

export default router;
