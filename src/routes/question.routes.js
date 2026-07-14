import express from "express";
import {
  createMultipleQuestions,
  updateQuestion,
  deleteQuestion,
  getQuestionsByStakeholder,
  getAllQuestions,
  getQuestionById,
  reorderQuestions,
  cloneTemplate,
  uploadQuestions,
  deleteOrganizationQuestions,
  downloadTemplate
} from "../controllers/question.controller.js";
import { protect, flexibleProtect } from "../middlewares/auth.middleware.js";
import { excelUpload } from "../middlewares/multer.middleware.js";

const router = express.Router();


// Admin CRUD routes (Protected)

/**
 * @swagger
 * /api/v1/questions/all:
 *   get:
 *     summary: Get all questions with optional filters
 *     description: Returns all questions. Supports filtering by stakeholder, domain, subdomain, and orgName. Admin only.
 *     tags:
 *       - Questions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: stakeholder
 *         schema:
 *           type: string
 *         description: Filter by stakeholder type (e.g. employee, leader, manager)
 *       - in: query
 *         name: domain
 *         schema:
 *           type: string
 *         description: Filter by domain
 *       - in: query
 *         name: orgName
 *         schema:
 *           type: string
 *         description: Filter by organization name
 *     responses:
 *       200:
 *         description: List of questions returned
 *       401:
 *         description: Unauthorized
 */
router.get("/all", protect, getAllQuestions);

/**
 * @swagger
 * /api/v1/questions/template/download:
 *   get:
 *     summary: Download Excel question template
 *     description: Downloads a blank Excel template for bulk question upload.
 *     tags:
 *       - Questions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Excel template file download
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Unauthorized
 */
router.get("/template/download", protect, downloadTemplate);

/**
 * @swagger
 * /api/v1/questions/{id}:
 *   get:
 *     summary: Get a single question by ID
 *     description: Returns full details of a specific question.
 *     tags:
 *       - Questions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Question ID
 *     responses:
 *       200:
 *         description: Question returned successfully
 *       404:
 *         description: Question not found
 */
router.get("/:id", protect, getQuestionById);

/**
 * @swagger
 * /api/v1/questions/multiple:
 *   post:
 *     summary: Create multiple questions at once
 *     description: Batch creates multiple questions for an organization.
 *     tags:
 *       - Questions
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               questions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     questionCode:
 *                       type: string
 *                     questionStem:
 *                       type: string
 *                     domain:
 *                       type: string
 *                     subdomain:
 *                       type: string
 *                     stakeholder:
 *                       type: string
 *                     scale:
 *                       type: string
 *                       enum: [SCALE_1_5, FORCED_CHOICE]
 *     responses:
 *       201:
 *         description: Questions created successfully
 *       400:
 *         description: Invalid data
 */
router.post("/multiple", protect, createMultipleQuestions);

/**
 * @swagger
 * /api/v1/questions/clone:
 *   post:
 *     summary: Clone master question template to an organization
 *     description: Copies all master questions (orgName=null) and assigns them to the authenticated admin's organization.
 *     tags:
 *       - Questions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Template cloned successfully
 *       400:
 *         description: Questions already exist for this organization
 *       401:
 *         description: Unauthorized
 */
router.post("/clone", protect, cloneTemplate);

/**
 * @swagger
 * /api/v1/questions/upload:
 *   post:
 *     summary: Upload questions from an Excel file
 *     description: Parses an uploaded Excel file and bulk-creates or updates questions for the organization.
 *     tags:
 *       - Questions
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Excel file (.xlsx) containing questions
 *     responses:
 *       200:
 *         description: Questions uploaded and processed successfully
 *       400:
 *         description: Invalid file format or data
 *       401:
 *         description: Unauthorized
 */
router.post("/upload", protect, excelUpload.single("file"), uploadQuestions);

/**
 * @swagger
 * /api/v1/questions/reorder:
 *   put:
 *     summary: Reorder questions (batch drag-and-drop)
 *     description: Updates the order/position of multiple questions. Used for drag-and-drop reordering in the admin UI.
 *     tags:
 *       - Questions
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               questions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     order:
 *                       type: integer
 *     responses:
 *       200:
 *         description: Questions reordered successfully
 *       401:
 *         description: Unauthorized
 */
router.put("/reorder", protect, reorderQuestions);

/**
 * @swagger
 * /api/v1/questions/{id}:
 *   put:
 *     summary: Update a question
 *     description: Updates the fields of an existing question by its ID.
 *     tags:
 *       - Questions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Question ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               questionStem:
 *                 type: string
 *               domain:
 *                 type: string
 *               subdomain:
 *                 type: string
 *               scale:
 *                 type: string
 *     responses:
 *       200:
 *         description: Question updated successfully
 *       404:
 *         description: Question not found
 */
router.put("/:id", protect, updateQuestion);

/**
 * @swagger
 * /api/v1/questions/organization/all:
 *   delete:
 *     summary: Delete all questions for an organization
 *     description: Permanently deletes all questions assigned to the authenticated admin's organization.
 *     tags:
 *       - Questions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All organization questions deleted
 *       401:
 *         description: Unauthorized
 */
router.delete("/organization/all", protect, deleteOrganizationQuestions);

/**
 * @swagger
 * /api/v1/questions/{id}:
 *   delete:
 *     summary: Soft delete a question
 *     description: Marks a question as deleted (isDeleted=true) without removing it from the database.
 *     tags:
 *       - Questions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Question ID
 *     responses:
 *       200:
 *         description: Question soft deleted
 *       404:
 *         description: Question not found
 */
router.delete("/:id", protect, deleteQuestion);

// User / Assessment route
/**
 * @swagger
 * /api/v1/questions:
 *   get:
 *     summary: Get questions by stakeholder for an assessment
 *     description: Returns all active (non-deleted) questions filtered by stakeholder type. Used during assessment to load questions. Accessible by logged-in users and invited guests.
 *     tags:
 *       - Questions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: stakeholder
 *         required: true
 *         schema:
 *           type: string
 *           enum: [employee, leader, manager]
 *         description: Stakeholder role to get questions for
 *       - in: query
 *         name: orgName
 *         schema:
 *           type: string
 *         description: Organization name (optional filter)
 *     responses:
 *       200:
 *         description: Questions returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   questionCode:
 *                     type: string
 *                   questionStem:
 *                     type: string
 *                   domain:
 *                     type: string
 *                   subdomain:
 *                     type: string
 *                   scale:
 *                     type: string
 *                   stakeholder:
 *                     type: string
 *       401:
 *         description: Unauthorized
 */
router.get("/", flexibleProtect, getQuestionsByStakeholder);

export default router;