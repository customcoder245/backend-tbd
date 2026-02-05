// import express from "express";
// import {
//   // createQuestion,
//   createMultipleQuestions,
//   updateQuestion,
//   deleteQuestion,
//   getQuestionsByStakeholder
// } from "../controllers/question.controller.js";

// const router = express.Router();

// // Admin routes
// /*

// router.post("/", createQuestion);
//  */
// router.post("/multiple", createMultipleQuestions);     // Multiple question creation 
// router.put("/:id", updateQuestion);                   // Update question
// router.delete("/:id", deleteQuestion);               // Soft delete question

// // User / Assessment route
// router.get("/", getQuestionsByStakeholder); // Get questions by stakeholder

// export default router;



import express from "express";
import {
  createMultipleQuestions,
  updateQuestion,
  deleteQuestion,
  getQuestionsByStakeholder,
  getAllQuestions,
  getQuestionById
} from "../controllers/question.controller.js";

const router = express.Router();

// Admin CRUD routes
router.get("/all", getAllQuestions);                  // Get all questions with filters
router.get("/:id", getQuestionById);                  // Get single question by ID
router.post("/multiple", createMultipleQuestions);     // Multiple question creation 
router.put("/:id", updateQuestion);                   // Update question
router.delete("/:id", deleteQuestion);                // Soft delete question

// User / Assessment route
router.get("/", getQuestionsByStakeholder);           // Get questions by stakeholder (for assessments)

export default router;