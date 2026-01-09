import express from "express";
import {
  // createQuestion,
  createMultipleQuestions,
  updateQuestion,
  deleteQuestion,
  getQuestionsByStakeholder
} from "../controllers/question.controller.js";

const router = express.Router();

// Admin routes
/*

router.post("/", createQuestion);
 */
router.post("/multiple", createMultipleQuestions);     // Multiple question creation 
router.put("/:id", updateQuestion);                   // Update question
router.delete("/:id", deleteQuestion);               // Soft delete question

// User / Assessment route
router.get("/", getQuestionsByStakeholder); // Get questions by stakeholder

export default router;
