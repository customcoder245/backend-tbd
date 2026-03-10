import express from "express";
import {
  createMultipleQuestions,
  updateQuestion,
  deleteQuestion,
  getQuestionsByStakeholder,
  getAllQuestions,
  getQuestionById,
  reorderQuestions,
  cloneTemplate
} from "../controllers/question.controller.js";
import { protect, flexibleProtect } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Admin CRUD routes (Protected)
router.get("/all", protect, getAllQuestions);                  // Get all questions with filters
router.get("/:id", protect, getQuestionById);                  // Get single question by ID
router.post("/multiple", protect, createMultipleQuestions);     // Multiple question creation 
router.post("/clone", protect, cloneTemplate);                 // Clone master template to organization
router.put("/reorder", protect, reorderQuestions);              // Batch reorder questions (Drag & Drop)
router.put("/:id", protect, updateQuestion);                   // Update question
router.delete("/:id", protect, deleteQuestion);                // Soft delete question

// User / Assessment route
router.get("/", flexibleProtect, getQuestionsByStakeholder);           // Get questions by stakeholder (Assessment)

export default router;