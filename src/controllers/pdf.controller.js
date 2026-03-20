import path from 'path';
import ejs from 'ejs';
import pdf from 'html-pdf';
import User from '../models/user.model.js';
import { getReportData } from '../services/reportService.js';

// Manually define __dirname in ES modules (for correct module paths)
const __dirname = path.dirname(new URL(import.meta.url).pathname);

export const generateReportPdf = async (req, res) => {
    try {
        const { userId, selectedDomain, selectedSubdomain } = req.body;

        // Fetch user data
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Fetch report data
        const reportData = await getReportData(userId, selectedDomain, selectedSubdomain);
        if (!reportData) {
            return res.status(404).json({ message: 'Report data not found' });
        }

        // Prepare data for the template
        const templateData = {
            userName: user.name,
            overallScore: reportData.overallScore,
            detailedInsights: reportData.insights,
            objectives: reportData.keyResults,
        };

        // Correct template path using path.resolve
        const templatePath = path.resolve(__dirname, '..', 'views', 'report_template.ejs'); // Ensure we get the correct path to views
        console.log("Resolved Template Path:", templatePath); // Log to check the path

        // Render the EJS template with the data
        ejs.renderFile(templatePath, templateData, {}, (err, html) => {
            if (err) {
                console.error("Error rendering template:", err);
                return res.status(500).json({ message: 'Error rendering template', error: err });
            }

            // Convert HTML to PDF
            pdf.create(html, { format: 'A4' }).toBuffer((err, buffer) => {
                if (err) {
                    console.error("Error generating PDF:", err);
                    return res.status(500).json({ message: 'Error generating PDF', error: err });
                }

                // Send PDF as a response
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', 'attachment; filename=report.pdf');
                res.send(buffer);
            });
        });
    } catch (error) {
        console.error('Unexpected error during PDF generation:', error);
        res.status(500).json({ message: 'Error generating PDF', error: error });
    }
};