import PDFDocument from "pdfkit-table";

/**
 * PDF Report Generator Service
 * Premium POD-360™ performance dossier
 */
class PDFReportService {
    constructor() {
        this.colors = {
            primary: "#1A3652",    // Dark Navy
            secondary: "#448CD2",  // Talent Blue
            accent: "#FF5656",     // Red / Low
            success: "#30AD43",    // Green / High
            warning: "#FEE114",    // Yellow / Med
            text: "#334155",       // Slate 700
            lightText: "#64748B",  // Slate 500
            border: "#E2E8F0",     // Slate 200
            ice: "#EDF5FD",        // Light Gray/Blue
            white: "#FFFFFF"
        };
    }

    getBulletedLines(text, limit = 10) {
        if (!text) return [];
        return text.split(/\r?\n/)
            .filter(line => line.includes('•'))
            .map(line => line.replace(/•/g, '').trim())
            .filter(line => line.length > 0)
            .slice(0, limit);
    }

    async generateReport(data, stream) {
        const doc = new PDFDocument({ size: "A4", margin: 50, bufferPages: true });
        doc.pipe(stream);

        const { report, user, aiInsight } = data;
        const userName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || user?.email || "Participant";
        const orgName = user?.orgName || "Talent By Design";
        const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

        // Build Pages
        this.drawCover(doc, userName, orgName, dateStr);

        doc.addPage();
        this.drawHeader(doc, userName);
        this.drawSystemArchitecture(doc);

        doc.addPage();
        this.drawHeader(doc, userName);
        this.drawExecutiveSummary(doc, report, aiInsight);

        // Domain & Subdomain Pages
        for (const domain of ["People Potential", "Operational Steadiness", "Digital Fluency"]) {
            // 1. Domain Summary Page
            doc.addPage();
            this.drawHeader(doc, userName);
            await this.drawDomainDetailedPage(doc, domain, report.scores?.domains?.[domain], userName);

            // 2. Subdomain Deep Dive Pages (Iterating over Subdomains for this domain)
            const subs = report.scores?.domains?.[domain]?.subdomains || {};
            const subFeedback = report.scores?.domains?.[domain]?.subdomainFeedback || {};

            for (const sName of Object.keys(subs)) {
                // subs[sName] can be either a raw number or an object with a .score property
                const rawVal = subs[sName];
                const sScore = typeof rawVal === "object" ? (rawVal?.score ?? 0) : (rawVal ?? 0);
                doc.addPage();
                this.drawHeader(doc, userName);
                this.drawSubdomainDetailedPage(doc, userName, domain, sName, sScore, subFeedback[sName]);
            }
        }

        // Appendix: Detailed Raw Responses
        if (report.responses && report.responses.length > 0) {
            doc.addPage();
            this.drawHeader(doc, userName);
            await this.drawAppendixResponses(doc, report.responses);
        }

        this.applyPageNumbers(doc);
        doc.end();
    }

    drawCover(doc, userName, orgName, dateStr) {
        // Decorative background
        doc.rect(0, 0, 600, 842).fill(this.colors.white);
        doc.rect(0, 0, 200, 842).fill(this.colors.ice);
        doc.rect(200, 0, 2, 842).fill(this.colors.border);

        // Logo text
        doc.fillColor(this.colors.primary).font("Helvetica-Bold").fontSize(18).text("TALENT BY DESIGN", 240, 60);
        doc.fontSize(8).font("Helvetica").text("SCALING HUMAN POTENTIAL IN A DIGITAL WORLD", 240, 75);

        // Titles
        doc.fontSize(54).font("Helvetica-Bold").fillColor(this.colors.primary).text("POD-360™", 240, 250);
        doc.fontSize(22).font("Helvetica").text("Confidential Performance Profile", 240, 310);

        doc.rect(240, 360, 40, 4).fill(this.colors.secondary);

        // Subject Info
        doc.fontSize(16).font("Helvetica-Bold").fillColor(this.colors.primary).text("PARTICIPANT:", 240, 420);
        doc.fontSize(24).text(userName, 240, 440);

        doc.fontSize(10).font("Helvetica").fillColor(this.colors.lightText).text(`ORGANIZATION: ${orgName}`, 240, 485);
        doc.text(`DATE ISSUED: ${dateStr}`, 240, 500);

        // Footer graphic
        doc.circle(100, 750, 60).lineWidth(1).strokeColor(this.colors.secondary).stroke();
    }

    drawHeader(doc, userName) {
        doc.fillColor(this.colors.lightText).fontSize(7).font("Helvetica").text(userName.toUpperCase(), 400, 30, { align: "right" });
        doc.moveTo(50, 40).lineTo(550, 40).strokeColor(this.colors.border).lineWidth(0.5).stroke();
    }

    applyPageNumbers(doc) {
        const pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
            doc.switchToPage(i);
            if (i === 0) continue;
            doc.fillColor(this.colors.lightText).fontSize(8).font("Helvetica").text(`© ${new Date().getFullYear()} Talent By Design | POD-360™ System Data`, 50, 800);
            doc.text(`Page ${i + 1}`, 530, 800);
        }
    }

    drawSystemArchitecture(doc) {
        doc.fontSize(24).font("Helvetica-Bold").fillColor(this.colors.primary).text("POD-360™ Model", 50, 70);
        doc.moveDown();
        doc.fontSize(10).font("Helvetica").fillColor(this.colors.text).text("The POD-360™ model evaluates performance across three interdependent dimensions. Sustainability requires balance between these areas; strength in one rarely compensates for a deficit in another over the long term.", { lineGap: 4 });

        // Domain boxes
        const domains = [
            { name: "1. PEOPLE POTENTIAL", d: "Measuring the psychological, relational, and cultural health of the workspace." },
            { name: "2. OPERATIONAL STEADINESS", d: "Strategies for prioritization, execution, and reliable resource management." },
            { name: "3. DIGITAL FLUENCY", d: "The adoption of technology, data literacy, and digital collaboration agilely." }
        ];

        let y = 170;
        domains.forEach(d => {
            doc.rect(50, y, 500, 60).fill(this.colors.ice);
            doc.fillColor(this.colors.primary).fontSize(11).font("Helvetica-Bold").text(d.name, 70, y + 15);
            doc.fillColor(this.colors.text).fontSize(9).font("Helvetica").text(d.d, 70, y + 32);
            y += 75;
        });

        // Interrelation explaining
        doc.fontSize(14).font("Helvetica-Bold").fillColor(this.colors.secondary).text("THE DATA SYNERGY", 50, 420);
        doc.fontSize(10).font("Helvetica").text("Your data is distributed across these domains to create a 'Portfolio Score'. We look for the Equilibrium Point.", { lineGap: 3 });

        this.drawPODTriangle(doc, 300, 620, 140, { p: 33.3, o: 33.3, d: 33.3 });
    }

    drawPODTriangle(doc, x, y, size, data) {
        doc.save();
        doc.translate(x, y);

        const radius = size;
        const P = { x: 0, y: -radius }; // Top
        const O = { x: -radius * Math.sin(Math.PI / 3), y: radius * Math.cos(Math.PI / 3) }; // Bottom Left
        const D = { x: radius * Math.sin(Math.PI / 3), y: radius * Math.cos(Math.PI / 3) }; // Bottom Right

        // Draw the rounded container triangle
        doc.lineJoin('round').lineWidth(5).strokeColor(this.colors.border);
        doc.moveTo(P.x, P.y).lineTo(O.x, O.y).lineTo(D.x, D.y).closePath().stroke();

        const p = data.p || 33.3;
        const o = data.o || 33.3;
        const d = data.d || 33.3;
        const total = p + o + d;
        const CX = (p * P.x + o * O.x + d * D.x) / total;
        const CY = (p * P.y + o * O.y + d * D.y) / total;

        doc.fillColor("#E6F0FA").opacity(0.8).moveTo(CX, CY).lineTo(P.x, P.y).lineTo(O.x, O.y).closePath().fill();
        doc.fillColor("#BFE0F6").opacity(0.8).moveTo(CX, CY).lineTo(P.x, P.y).lineTo(D.x, D.y).closePath().fill();
        doc.fillColor("#357ABD").opacity(0.8).moveTo(CX, CY).lineTo(O.x, O.y).lineTo(D.x, D.y).closePath().fill();

        doc.opacity(1).fillColor(this.colors.primary).font("Helvetica-Bold").fontSize(10);
        doc.text("PEOPLE", P.x - 20, P.y - 20);
        doc.text("OPERATIONAL", O.x - 40, O.y + 10);
        doc.text("DIGITAL", D.x - 10, D.y + 10);

        doc.restore();
    }

    drawExecutiveSummary(doc, report, aiInsight) {
        doc.fontSize(24).font("Helvetica-Bold").fillColor(this.colors.primary).text("Executive Summary", 50, 70);

        // Gauge
        const score = Math.round(report?.scores?.overall || 0);
        this.drawGauge(doc, 300, 220, 110, score);

        // Classification Card
        const classification = report?.classification || "Medium";
        const color = score >= 75 ? this.colors.success : score <= 50 ? this.colors.accent : this.colors.warning;

        doc.rect(50, 320, 500, 100).fill(this.colors.ice);
        doc.fillColor(color).fontSize(14).font("Helvetica-Bold").text(classification.toUpperCase() + " PERFORMANCE INDEX", 70, 340);
        doc.fillColor(this.colors.primary).fontSize(11).text(aiInsight?.title || "Operational Trajectory Established", 70, 365);
        doc.fillColor(this.colors.text).fontSize(9).font("Helvetica").text(aiInsight?.description || "Ongoing system monitoring based on 360 feedback cycles.", 70, 385, { width: 460 });

        doc.fontSize(16).font("Helvetica-Bold").fillColor(this.colors.primary).text("POD SYNERGY MAP", 50, 450);

        // Dynamic Triangle for actual scores
        const dp = report.scores?.domains?.["People Potential"]?.score || 33.3;
        const doP = report.scores?.domains?.["Operational Steadiness"]?.score || 33.3;
        const dd = report.scores?.domains?.["Digital Fluency"]?.score || 33.3;
        this.drawPODTriangle(doc, 300, 610, 120, { p: dp, o: doP, d: dd });
    }

    drawGauge(doc, x, y, r, val) {
        doc.save();
        doc.translate(x, y);
        // Track
        doc.lineWidth(22).lineCap("round").strokeColor(this.colors.border).arc(0, 0, r, Math.PI, 2 * Math.PI).stroke();
        // Progress
        const color = val >= 75 ? this.colors.success : val <= 50 ? this.colors.accent : this.colors.warning;
        doc.strokeColor(color).arc(0, 0, r, Math.PI, Math.PI + (Math.max(0, Math.min(val, 100)) / 100) * Math.PI).stroke();
        // Values text
        doc.fillColor(this.colors.primary).fontSize(42).font("Helvetica-Bold").text(`${val}%`, -45, 10, { width: 90, align: "center" });
        doc.restore();
    }

    drawDynamicBlock(doc, title, subtitle, items, yStart, isIce, userName) {
        let y = yStart;
        let contentHeight = subtitle ? 55 : 40;
        let itemsHeight = 0;

        items.forEach(item => {
            if (item.type === 'text') {
                itemsHeight += doc.heightOfString(item.text, { width: 440 }) + (item.space || 5);
            } else if (item.type === 'bullet') {
                itemsHeight += doc.heightOfString(item.text, { width: 440 }) + (item.space || 5);
            } else if (item.type === 'kr') {
                itemsHeight += doc.heightOfString(item.text, { width: 420 }) + 20;
            }
        });

        const totalHeight = Math.max(80, contentHeight + itemsHeight + 10); // adding padding at bottom

        if (y + totalHeight > 780) {
            doc.addPage();
            this.drawHeader(doc, userName || "");
            y = 70;
        }

        const fillColor = isIce ? this.colors.ice : this.colors.white;
        doc.rect(50, y, 500, totalHeight).fill(fillColor).strokeColor(isIce ? this.colors.secondary : this.colors.border).lineWidth(1).stroke();

        doc.fillColor(this.colors.primary).fontSize(14).font("Helvetica-Bold").text(title, 70, y + 15);
        if (subtitle) {
            doc.fillColor(this.colors.lightText).fontSize(9).font("Helvetica").text(subtitle, 70, y + 32);
        }

        let currentItemY = y + contentHeight;

        items.forEach((item, idx) => {
            if (item.type === 'text') {
                doc.fillColor(item.color || this.colors.primary).fontSize(item.size || 10).font("Helvetica").text(item.text, 70, currentItemY, { width: 460 });
                currentItemY += doc.heightOfString(item.text, { width: 460 }) + (item.space || 5);
            } else if (item.type === 'bullet') {
                doc.circle(75, currentItemY + 4, 2).fill(item.bulletColor || this.colors.secondary);
                doc.fillColor(this.colors.primary).fontSize(9).font("Helvetica").text(item.text, 85, currentItemY, { width: 440 });
                currentItemY += doc.heightOfString(item.text, { width: 440 }) + (item.space || 5);
            } else if (item.type === 'kr') {
                doc.circle(85, currentItemY + 10, 12).lineWidth(2).strokeColor(this.colors.primary).stroke();
                doc.fillColor(this.colors.primary).fontSize(8).font("Helvetica-Bold").text(`${idx + 1}`, 82, currentItemY + 7);
                doc.fillColor(this.colors.primary).fontSize(9).font("Helvetica-Bold").text(`KR ${idx + 1}`, 110, currentItemY);
                doc.fillColor(this.colors.lightText).fontSize(8).font("Helvetica").text(item.text, 110, currentItemY + 12, { width: 420 });
                currentItemY += doc.heightOfString(item.text, { width: 420 }) + 20;
            }
        });

        return y + totalHeight + 20;
    }

    async drawDomainDetailedPage(doc, domainName, domainData, userName) {
        doc.fontSize(20).font("Helvetica-Bold").fillColor(this.colors.primary).text(`Domain: ${domainName}`, 50, 60);

        if (!domainData) {
            doc.fontSize(10).fillColor(this.colors.lightText).text("No data available for this domain.", 50, 90);
            return;
        }

        // Phase Indicator Badge
        const phase = domainData?.feedback?.phaseIndicator || "Calibration";
        doc.rect(420, 58, 130, 24).fill(this.colors.ice);
        doc.fillColor(this.colors.secondary).fontSize(10).font("Helvetica-Bold").text(phase.toUpperCase(), 420, 66, { width: 130, align: "center" });

        // Score Distribution & Gauge
        const dScore = Math.round(domainData?.score || 0);
        this.drawGauge(doc, 300, 170, 70, dScore);

        // Subdomain Breakdowns (Table format)
        doc.fontSize(12).font("Helvetica-Bold").fillColor(this.colors.primary).text("SUB-DOMAIN ANALYSIS OVERVIEW", 50, 210);
        const subs = domainData?.subdomains || {};
        const subNames = Object.keys(subs);

        let sy = 230;
        for (const sName of subNames) {
            const rawVal = subs[sName];
            const sVal = Math.round(typeof rawVal === "object" ? (rawVal?.score ?? 0) : (rawVal ?? 0));
            // Low/Med/High Logic for indicator
            const indColor = sVal >= 75 ? this.colors.success : sVal <= 50 ? this.colors.accent : this.colors.warning;

            doc.rect(50, sy, 500, 30).lineWidth(0.5).strokeColor(this.colors.border).stroke();
            doc.circle(70, sy + 15, 6).fill(indColor);
            doc.fillColor(this.colors.primary).fontSize(10).font("Helvetica-Bold").text(sName, 90, sy + 10);
            doc.fillColor(this.colors.primary).fontSize(12).font("Helvetica-Bold").text(`${sVal}%`, 500, sy + 10, { width: 40, align: "right" });
            sy += 40;
        }

        let currentY = sy + 20;

        // --- DYNAMIC BLOCKS ---

        // 1. INSIGHT BLOCK
        const mainInsight = domainData?.feedback?.insight || domainData?.feedback?.modelDescription || "";
        const insightLines = this.getBulletedLines(mainInsight, 3);
        const insightItems = insightLines.map(line => ({ type: 'bullet', text: line, bulletColor: this.colors.secondary }));

        if (insightItems.length === 0) insightItems.push({ type: 'text', text: "Analysis pending based on recently observed factors.", color: this.colors.lightText });

        currentY = this.drawDynamicBlock(doc, `Overall Insight for ${domainName}`, "Overall synthesis representation", insightItems, currentY, true, userName);

        // 2. OKR BLOCK
        const coachingLines = this.getBulletedLines(domainData?.feedback?.coachingTips || "", 4);
        const okrItems = coachingLines.map(kr => ({ type: 'kr', text: kr }));

        if (okrItems.length === 0) okrItems.push({ type: 'text', text: "No specific key results tailored for this grouping.", color: this.colors.lightText });

        currentY = this.drawDynamicBlock(doc, "Objectives and Key Results", "Develop essential skills based on domain analysis", okrItems, currentY, false, userName);

        // 3. RECOMMENDED OFFERINGS BLOCK
        const recLines = this.getBulletedLines(domainData?.feedback?.recommendedPrograms || "", 5);
        const recItems = recLines.map(rec => ({ type: 'bullet', text: rec, bulletColor: this.colors.primary }));

        if (recItems.length === 0) recItems.push({ type: 'text', text: "No supplemental recommendations evaluated presently.", color: this.colors.lightText });

        currentY = this.drawDynamicBlock(doc, "Recommended Offerings", "Targeted initiatives relative to findings", recItems, currentY, false, userName);
    }

    drawSubdomainDetailedPage(doc, userName, domainName, sName, sVal, sData) {
        doc.fontSize(10).font("Helvetica-Bold").fillColor(this.colors.lightText).text(`${domainName.toUpperCase()}`, 50, 60);
        doc.fontSize(20).font("Helvetica-Bold").fillColor(this.colors.primary).text(sName, 50, 75);

        // Score & Phase Indicator Badge
        const indColor = sVal >= 75 ? this.colors.success : sVal <= 50 ? this.colors.accent : this.colors.warning;

        doc.rect(480, 60, 70, 40).lineWidth(1).strokeColor(indColor).stroke();
        doc.fillColor(indColor).fontSize(20).font("Helvetica-Bold").text(`${Math.round(sVal)}%`, 480, 72, { width: 70, align: "center" });

        const phase = sData?.phaseIndicator || "Evaluating";
        doc.rect(50, 110, 130, 20).fill(this.colors.secondary);
        doc.fillColor(this.colors.white).fontSize(9).font("Helvetica-Bold").text(`PHASE: ${phase.toUpperCase()}`, 50, 116, { width: 130, align: "center" });

        let currentY = 150;

        // 1. INSIGHT BLOCK
        const mainInsight = sData?.insight || sData?.modelDescription || "";
        const insightLines = this.getBulletedLines(mainInsight, 5);
        const insightItems = insightLines.map(line => ({ type: 'bullet', text: line, bulletColor: this.colors.secondary }));

        if (insightItems.length === 0) insightItems.push({ type: 'text', text: "Analysis pending based on recent data models.", color: this.colors.lightText });

        currentY = this.drawDynamicBlock(doc, "Insight & Synthesis", null, insightItems, currentY, true, userName);

        // 2. OKR BLOCK
        const coachingLines = this.getBulletedLines(sData?.coachingTips || "", 4);
        const okrItems = coachingLines.map(kr => ({ type: 'bullet', text: kr, bulletColor: this.colors.secondary }));

        if (okrItems.length === 0) okrItems.push({ type: 'text', text: "No precise key items outlined.", color: this.colors.lightText });

        currentY = this.drawDynamicBlock(doc, "Objectives & Key Results (Targeted)", null, okrItems, currentY, false, userName);

        // 3. RECOMMENDED OFFERINGS BLOCK
        const recLines = this.getBulletedLines(sData?.recommendedPrograms || "", 5);
        const recItems = recLines.map(rec => ({ type: 'bullet', text: rec, bulletColor: this.colors.primary }));

        if (recItems.length === 0) recItems.push({ type: 'text', text: "No aligned programming tailored for this layer.", color: this.colors.lightText });

        currentY = this.drawDynamicBlock(doc, "Targeted Offerings & Programs", null, recItems, currentY, false, userName);
    }

    async drawAppendixResponses(doc, responses) {
        doc.fontSize(20).font("Helvetica-Bold").fillColor(this.colors.primary).text("Appendix A: Comprehensive Assessment Feed", 50, 60);
        doc.fontSize(10).font("Helvetica").fillColor(this.colors.lightText).text("Raw output mapping of individual assessment selections underpinning the generated analysis.", 50, 85);

        const table = {
            title: "",
            subtitle: "",
            headers: [
                { label: "Code", property: "code", width: 50, renderer: null },
                { label: "Assessment Prompt", property: "prompt", width: 330, renderer: null },
                { label: "Type", property: "type", width: 80, renderer: null },
                { label: "Value", property: "value", width: 40, renderer: null }
            ],
            datas: responses.map(r => ({
                code: r.questionCode || "N/A",
                prompt: r.questionStem || "Prompt Content",
                type: r.questionType || "Rating",
                value: r.value ? r.value.toString() : (r.selectedOption || "-")
            }))
        };

        // Render the table starting at a specific Y coordinate
        await doc.table(table, {
            start_y: 120,
            prepareHeader: () => doc.font("Helvetica-Bold").fontSize(8).fillColor(this.colors.primary),
            prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
                doc.font("Helvetica").fontSize(8).fillColor(this.colors.text);
            }
        });
    }

}

export default new PDFReportService();
