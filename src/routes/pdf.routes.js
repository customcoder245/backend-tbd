import express from 'express';
import { generateReportPdf } from '../controllers/pdf.controller.js';
import { flexibleProtect } from '../middlewares/auth.middleware.js';

const router = express.Router();

// POST route for generating the PDF report
router.post('/report', flexibleProtect, generateReportPdf);

export default router;
