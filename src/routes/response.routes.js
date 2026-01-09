import express from "express";
import { saveResponse } from "../controllers/response.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * Save or update response
 */
router.post("/", protect, saveResponse);

export default router;
