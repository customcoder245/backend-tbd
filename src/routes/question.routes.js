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
import { upload, excelUpload } from "../middlewares/multer.middleware.js";

const router = express.Router();


// Admin CRUD routes (Protected)
router.get("/all", protect, getAllQuestions);                  // Get all questions with filters
router.get("/template/download", protect, downloadTemplate);       // Download Excel template
router.get("/:id", protect, getQuestionById);                  // Get single question by ID
router.post("/multiple", protect, createMultipleQuestions);     // Multiple question creation 
router.post("/clone", protect, cloneTemplate);                 // Clone master template to organization
router.post("/upload", protect, excelUpload.single("file"), uploadQuestions); // Upload questions from Excel (no size limit)
router.put("/reorder", protect, reorderQuestions);              // Batch reorder questions (Drag & Drop)
router.put("/:id", protect, updateQuestion);                   // Update question
router.delete("/organization/all", protect, deleteOrganizationQuestions); // Delete all questions for an organization
router.delete("/:id", protect, deleteQuestion);                // Soft delete question

// User / Assessment route
router.get("/", flexibleProtect, getQuestionsByStakeholder);           // Get questions by stakeholder (Assessment)

export default router;