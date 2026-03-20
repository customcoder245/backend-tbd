    import express from 'express';
    import { generateReportPdf } from '../controllers/pdf.controller.js';

    const router = express.Router();

    // POST route for generating the PDF report
    router.post('/report', generateReportPdf);

    export default router;