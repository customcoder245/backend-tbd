import path from 'path';
import { fileURLToPath } from 'url';
import ejs from 'ejs';
import pdf from 'html-pdf';
import { getReportData } from '../services/reportService.js';

// Manually define __dirname in ES modules (for correct module paths)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generateReportPdf = async (req, res) => {
    try {
        const userId = req.body.userId || req.user?.userId || req.guest?.invitationId;
        const email = req.body.email || req.guest?.email;
        const selectedDomain = req.body.selectedDomain || req.body.domain;
        const selectedSubdomain = req.body.selectedSubdomain || req.body.subdomain;
        const selectedTopics =
            req.body.selectedTopics ||
            req.body.topics ||
            req.body.reportSections ||
            [];

        if (!userId && !email) {
            return res.status(400).json({ message: 'userId or email is required' });
        }

        if (selectedTopics && !Array.isArray(selectedTopics)) {
            return res.status(400).json({ message: 'selectedTopics must be an array when provided' });
        }

        const reportData = await getReportData({
            userId,
            email,
            loggedInUserId: req.user?.userId,
            selectedDomain,
            selectedSubdomain,
            selectedTopics
        });

        if (!reportData) {
            return res.status(404).json({ message: 'Report data not found' });
        }

        const templateData = {
            userName: `${reportData.user?.firstName || ''} ${reportData.user?.lastName || ''}`.trim() || 'User',
            userEmail: reportData.user?.email || '',
            department: reportData.user?.department || '',
            role: reportData.user?.role || '',
            organization: reportData.user?.orgName || '',
            overallScore: reportData.overallScore ?? 'N/A',
            overallClassification: reportData.overallClassification || 'N/A',
            generatedAt: reportData.generatedAt,
            aiInsight: reportData.aiInsight,
            domainSummary: reportData.domainSummary || [],
            sections: reportData.sections || []
        };

        const templatePath = path.resolve(__dirname, '..', 'views', 'report_template.ejs');
        console.log('Resolved Template Path:', templatePath);

        ejs.renderFile(templatePath, templateData, {}, (err, html) => {
            if (err) {
                console.error('Error rendering template:', err);
                return res.status(500).json({ message: 'Error rendering template', error: err });
            }

            pdf.create(html, {
                format: 'A4',
                border: {
                    top: '12mm',
                    right: '10mm',
                    bottom: '12mm',
                    left: '10mm'
                }
            }).toBuffer((err, buffer) => {
                if (err) {
                    console.error('Error generating PDF:', err);
                    return res.status(500).json({ message: 'Error generating PDF', error: err });
                }

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
