import handlebars from 'handlebars';
import { PDFDocument, rgb } from 'pdf-lib';
import fs from 'fs';
import feedbackData from '../data/domainSubdomainFeedback.js';
import { computeTopPriorities } from '../utils/priority.utils.js';

const BRAND_LOGO_URL = "https://res.cloudinary.com/dfpkn8g8h/image/upload/v1774516563/logos/talent_by_design_logo_new.svg";
const REPORT_BACK_COVER_URL = "https://res.cloudinary.com/dfpkn8g8h/image/upload/v1778732728/Frame_2147225299_grcclv.png";

class PDFReportService {
    constructor() {
        this.colors = {
            primary: "#1A3652",    // Dark Navy
            secondary: "#448CD2",  // Talent Blue
            sidebar: "#EDF5FD",    // Light Blue Sidebar
            friction: "#FF5656",   // Friction Red
            flow: "#30AD43",       // Flow Green
            resistance: "#FEE114", // Resistance Yellow
            text: "#334155",       // Slate 700
            lightText: "#64748B",  // Slate 500
            border: "#E2E8F0",     // Slate 200
            white: "#FFFFFF",
            accent: "#F8FAFC"
        };

        this.domainDescriptions = {
            "People Potential": "Focuses on the human side of performance, including mindset, adaptability, relational intelligence, and psychological safety. This domain measures the foundational cultural capacity required to sustain change.",
            "Operational Steadiness": "Examines the internal structures, prioritization, and resource management that enable consistent execution. This domain identifies operational friction that slows down delivery.",
            "Digital Fluency": "Measures the organization's readiness to leverage data, AI, and digital tools to drive productivity. This domain evaluates the technical and mental proficiency required in a digital environment."
        };

        this.subdomainDescriptions = {
            "Mindset & Adaptability": "The ability to stay resilient, learn from setbacks, and adapt to changing conditions and priorities. This measures how well the organization handles shifting pressures and evolving work requirements.",
            "Psychological Health & Safety": "The environment of trust where people feel safe to speak up, share ideas, and raise concerns without fear of negative consequences. It is the foundation of high-performing cultures.",
            "Relational & Emotional Intelligence": "The quality of interpersonal communication, empathy, and constructive conflict resolution across teams. It determines how well individuals work together under pressure.",
            "Prioritization": "The clarity and discipline in focusing on the highest-value work while managing competing requests. It identifies where focus drifts when urgent requests or local pressures rise.",
            "Workflow Clarity": "The transparency of roles, processes, and handoffs that ensure work moves forward without unnecessary bottlenecks or individual dependency.",
            "Effective Resource Management": "The alignment of time, talent, and capacity to support sustainable delivery and prevent overload. It measures the balance between delivery and sustainable workload.",
            "Data, AI & Automation Readiness": "The ability to access data and use emerging technologies to improve decision-making and reduce manual friction. It evaluates how well value is embedded into everyday work.",
            "Digital Communication & Collaboration": "The effective use of shared digital tools and norms to keep teams synchronized and productive. It measures the consistency needed for seamless collaboration at scale.",
            "Mindset, Confidence and Change Readiness": "The openness and confidence of individuals to adopt new digital tools and ways of working. It identifies where support and reinforcement are needed most.",
            "Tool & System Proficiency": "The practical skill and confidence in using the organization's core systems and technological infrastructure. It measures how effectively tools are being leveraged to their full value."
        };

        this.synergyIntro = "Your data is distributed across these domains to create a 'Portfolio Score'. We look for the Equilibrium Point (the center) as the marker for organizational stability. Large deviances indicate potential burnout or systemic fragility.";

        this.roleSynergyData = {
            "leader": {
                name: "Senior Leader",
                description: "As a Senior Leader, your responses reflect an executive-level perspective across your organization. Your inputs are analyzed across key domains to generate a comprehensive Portfolio Score. Strong alignment and balance across these domains indicate organizational health and stability, while significant gaps may signal potential burnout, misalignment, or systemic fragility."
            },
            "manager": {
                name: "Manager",
                description: "As a Manager, your responses reflect your perspective on how work is experienced and delivered within your team. Your inputs are analyzed across key domains to generate a Portfolio Score. Balanced results across these domains suggest a well-supported and stable team environment, while notable gaps may indicate pressure points, inefficiencies, or emerging risks."
            },
            "employee": {
                name: "Employee",
                description: "As an Employee, your responses reflect your day-to-day experience and interactions with your work and colleagues. Your inputs are analyzed across key domains to generate a Portfolio Score. Consistency and balance across these domains point to a healthy and supportive work environment, while significant differences may highlight areas of strain, disengagement, or operational challenges."
            }
        };

        this.subdomainIcons = {
            "Mindset & Adaptability": "https://res.cloudinary.com/dfpkn8g8h/image/upload/v1778735639/pp-ic1_pnlywx.png",
            "Psychological Health & Safety": "https://res.cloudinary.com/dfpkn8g8h/image/upload/v1778736594/pp-ic2_klxffw.png",
            "Relational & Emotional Intelligence": "https://res.cloudinary.com/dfpkn8g8h/image/upload/v1778735638/pp-ic3_yucymc.png",
            "Prioritization": "https://res.cloudinary.com/dfpkn8g8h/image/upload/v1778735638/os-ic1_a0rscw.png",
            "Workflow Clarity": "https://res.cloudinary.com/dfpkn8g8h/image/upload/v1778735638/os-ic2_qzzofe.png",
            "Effective Resource Management": "https://res.cloudinary.com/dfpkn8g8h/image/upload/v1778735638/os-ic3_lgtro6.png",
            "Data, AI & Automation Readiness": "https://res.cloudinary.com/dfpkn8g8h/image/upload/v1778735638/df-ic1_yvhseb.png",
            "Digital Communication & Collaboration": "https://res.cloudinary.com/dfpkn8g8h/image/upload/v1778735637/df-ic3_n1iwoj.png",
            "Mindset, Confidence and Change Readiness": "https://res.cloudinary.com/dfpkn8g8h/image/upload/v1778735637/df-ic2_onwsxj.png",
            "Tool & System Proficiency": "https://res.cloudinary.com/dfpkn8g8h/image/upload/v1778735637/df-ic4_kqi22i.png"
        };

        this._browser = null;
        this._template = null;
        this._launchingPromise = null;

        // Register Helpers once (not on every request)
        const helpers = {
            round: (val) => Math.round(val || 0),
            getClassification: (score) => this._getClassification(score),
            gaugeColor: (val) => {
                const v = Math.round(val || 0);
                if (v >= 75) return this.colors.flow;
                if (v <= 50) return this.colors.friction;
                return this.colors.resistance;
            },
            gaugePath: (r, val) => {
                const v = Math.max(0, Math.min(val || 0, 100));
                const angle = Math.PI + (v / 100) * Math.PI;
                return `${100 + r * Math.cos(angle)} ${100 + r * Math.sin(angle)}`;
            },
            gaugePathX: (r, val) => {
                const v = Math.max(0, Math.min(val || 0, 100));
                const angle = Math.PI + (v / 100) * Math.PI;
                return 100 + r * Math.cos(angle);
            },
            gaugePathY: (r, val) => {
                const v = Math.max(0, Math.min(val || 0, 100));
                const angle = Math.PI + (v / 100) * Math.PI;
                return 100 + r * Math.sin(angle);
            },
            toLowerCase: (str) => (str || "").toLowerCase(),
            add: (a, b) => (a || 0) + (b || 0),
            multiply: (a, b) => (a || 0) * (b || 0),
            calcGaugeOffset: (score) => {
                const radius = 45;
                const circumference = 2 * Math.PI * radius;
                return circumference - (circumference * ((score || 0) / 100));
            }
        };
        Object.keys(helpers).forEach(name => handlebars.registerHelper(name, helpers[name]));

        // Eagerly launch browser in the background to reduce first-request latency
        this._getBrowser().catch(err => console.log("[PDFService] Eager browser launch failed:", err.message));
    }

    _getClassification(score) {
        const s = Math.round(score || 0);
        if (s < 50) return "Low";
        if (s < 75) return "Medium";
        return "High";
    }

    _stateLabel(score) {
        const s = Math.round(score || 0);
        if (s >= 75) return "STRENGTH";
        if (s >= 50) return "MONITOR";
        return "NEEDS ATTENTION";
    }

    _buildTriangleModelData(report) {
        const ppScore = Math.round(report?.scores?.domains?.["People Potential"]?.score || 0);
        const osScore = Math.round(report?.scores?.domains?.["Operational Steadiness"]?.score || 0);
        const dfScore = Math.round(report?.scores?.domains?.["Digital Fluency"]?.score || 0);

        const center = { x: 150, y: 153 };
        const radius = 120;
        const P = { x: center.x, y: center.y - radius };
        const O = {
            x: center.x - radius * Math.sin(Math.PI / 3),
            y: center.y + radius * Math.cos(Math.PI / 3),
        };
        const D = {
            x: center.x + radius * Math.sin(Math.PI / 3),
            y: center.y + radius * Math.cos(Math.PI / 3),
        };

        const scoreTotal = ppScore + osScore + dfScore || 1;
        const wP = osScore / scoreTotal;
        const wO = dfScore / scoreTotal;
        const wD = ppScore / scoreTotal;

        const C = {
            x: wP * P.x + wO * O.x + wD * D.x,
            y: wP * P.y + wO * O.y + wD * D.y,
        };

        const triPoints = (a, b, c) => `${a.x},${a.y} ${b.x},${b.y} ${c.x},${c.y}`;

        return {
            ppScore,
            osScore,
            dfScore,
            sectorOS: triPoints(C, O, D),
            sectorDF: triPoints(C, P, D),
            sectorPP: triPoints(C, P, O),
            outline: triPoints(P, O, D),
            labelPP: { x: P.x, y: P.y - 22 },
            labelOS: { x: O.x - 8, y: O.y + 18 },
            labelDF: { x: D.x + 8, y: D.y + 18 },
        };
    }

    _buildExecutiveDashboardData(report, topPriorities = [], aiInsight = null, comparisonData = null) {
        const overall = Math.round(report?.scores?.overall || 0);
        const cls = this._getClassification(overall);
        const domains = report?.scores?.domains || {};

        const domainMatrix = ["People Potential", "Operational Steadiness", "Digital Fluency"]
            .filter((name) => domains[name])
            .map((name) => {
                const d = domains[name];
                const score = Math.round(d.score || 0);
                const benchmarkRaw = comparisonData?.orgAvg?.[name]?.avgScore;
                const benchmark = benchmarkRaw != null ? Math.round(benchmarkRaw) : null;
                const gap = benchmark != null ? score - benchmark : null;
                return {
                    name,
                    score,
                    classification: this._getClassification(score),
                    stateLabel: this._stateLabel(score),
                    stateClass: score >= 75 ? "state-strength" : score >= 50 ? "state-monitor" : "state-attention",
                    benchmark,
                    gap,
                    gapLabel: gap != null ? `${gap >= 0 ? "+" : ""}${gap}%` : "—",
                    gapClass: gap == null ? "" : gap >= 0 ? "gap-positive" : "gap-negative",
                    focusAction: score >= 75 ? "Continue" : score >= 50 ? "Optimize" : "Accelerate",
                    focusClass: score >= 75 ? "focus-continue" : score >= 50 ? "focus-optimize" : "focus-accelerate",
                    description: this.domainDescriptions[name] || "",
                };
            });

        const buildRangeSummary = (domains, sortAsc = false) => {
            if (!domains.length) return null;
            const sorted = [...domains].sort((a, b) => (sortAsc ? a.score - b.score : b.score - a.score));
            const avg = Math.round(domains.reduce((sum, d) => sum + d.score, 0) / domains.length);
            return {
                avg,
                count: domains.length,
                domainNames: sorted.map((d) => d.name),
            };
        };

        const strengthDomains = domainMatrix.filter((d) => d.score >= 75);
        const averageDomains = domainMatrix.filter((d) => d.score >= 50 && d.score < 75);
        const opportunityDomains = domainMatrix.filter((d) => d.score < 50);

        const strengthSummary = buildRangeSummary(strengthDomains);
        const averageSummary = buildRangeSummary(averageDomains);
        const opportunitySummary = buildRangeSummary(opportunityDomains, true);

        const lowCount = topPriorities.filter((p) => p.classification === "Low").length;
        const riskLevel = lowCount >= 2 ? "HIGH" : lowCount === 1 ? "MODERATE" : "LOW";
        const riskClass = riskLevel === "LOW" ? "risk-low" : riskLevel === "MODERATE" ? "risk-moderate" : "risk-high";

        const aiInsights = domainMatrix.map((d) => ({
            title: d.name,
            text: d.score >= 75
                ? `${d.name} is performing at ${d.score}% — a relative strength to leverage across the organization.`
                : `${d.name} at ${d.score}% — targeted leadership action is recommended to prevent downstream friction.`,
            score: d.score,
        }));

        const recommendations = domainMatrix.map((d) => ({
            name: d.name,
            focus: d.focusAction,
            focusClass: d.focusClass,
            description: d.description,
        }));

        const roadmap = {
            quick: topPriorities.slice(0, 1).map((p) => p.recommendedStep).filter(Boolean),
            shortTerm: topPriorities.slice(1, 2).map((p) => p.recommendedStep).filter(Boolean),
            strategic: topPriorities.slice(2, 3).map((p) => p.recommendedStep).filter(Boolean),
        };
        if (!roadmap.quick.length) {
            roadmap.quick = ["Review lowest-scoring subdomain with your leadership team within 30 days."];
        }
        if (!roadmap.shortTerm.length) {
            roadmap.shortTerm = domainMatrix.filter((d) => d.score < 75).map((d) => `Implement improvement plan for ${d.name}.`);
        }
        if (!roadmap.strategic.length) {
            roadmap.strategic = ["Embed POD-360 practices into quarterly planning and leadership routines."];
        }

        const takeaways = [
            {
                title: "Overall Trajectory",
                text: aiInsight?.description || `Portfolio score of ${overall}% reflects ${cls.toLowerCase()} efficiency across assessed domains.`,
            },
            {
                title: "Primary Strength",
                text: strengthSummary
                    ? `Strength domains average ${strengthSummary.avg}% across ${strengthSummary.count} area${strengthSummary.count > 1 ? "s" : ""} — leverage this momentum for broader change.`
                    : "Establish baseline strengths by completing the recommended first steps below.",
            },
            {
                title: "Priority Focus",
                text: topPriorities[0]?.impact || "Monitor all domains and reinforce consistent leadership practices.",
            },
            {
                title: "Immediate Action",
                text: topPriorities[0]?.recommendedStep || "Review the detailed domain sections that follow this summary.",
            },
        ];

        return {
            overallHealth: overall >= 75 ? "STRONG" : overall >= 50 ? "MONITOR" : "NEEDS ATTENTION",
            healthClass: overall >= 75 ? "health-strong" : overall >= 50 ? "health-monitor" : "health-critical",
            portfolioScore: overall,
            portfolioClass: cls,
            portfolioColor: overall >= 75 ? this.colors.flow : overall >= 50 ? this.colors.resistance : this.colors.friction,
            percentileLabel: `Top ${Math.max(8, Math.min(92, 100 - Math.round(overall * 0.85)))}% vs. benchmark`,
            riskLevel,
            riskClass,
            strengthSummary,
            averageSummary,
            opportunitySummary,
            domainMatrix,
            aiInsights,
            recommendations,
            roadmap,
            takeaways,
            overallTrend: overall >= 75 ? "Improving" : overall >= 50 ? "Stable" : "Needs Attention",
            trendClass: overall >= 75 ? "trend-up" : overall >= 50 ? "trend-stable" : "trend-down",
        };
    }

    async generateReport(data, stream) {
        const buffer = await this.generateReportBuffer(data);
        stream.write(buffer);
        stream.end();
    }

    async _getBrowser() {
        // 1. If browser is already open and connected, return it
        if (this._browser && this._browser.isConnected()) {
            return this._browser;
        }

        // 2. If already launching, wait for that promise
        if (this._launchingPromise) {
            console.log("[PDFService] Waiting for existing browser launch...");
            return this._launchingPromise;
        }

        // 3. Start a new launch process
        console.log("[PDFService] No active browser. Starting launch process...");
        this._launchingPromise = (async () => {
            try {
                let browser;
                // Production / Render Environment
                if (process.env.RENDER || process.env.NODE_ENV === 'production') {
                    console.log("[PDFService] Launching Puppeteer for Production/Render...");
                    const puppeteer = (await import('puppeteer')).default;
                    browser = await puppeteer.launch({
                        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--no-zygote', '--single-process'],
                        headless: 'new'
                    });
                }
                // Vercel Environment (Serverless)
                else if (process.env.VERCEL) {
                    console.log("[PDFService] Launching Puppeteer-Core for Vercel...");
                    const puppeteerCore = (await import('puppeteer-core')).default;
                    const chromium = (await import('@sparticuz/chromium')).default;
                    browser = await puppeteerCore.launch({
                        args: chromium.args,
                        defaultViewport: chromium.defaultViewport,
                        executablePath: await chromium.executablePath(),
                        headless: chromium.headless,
                        ignoreHTTPSErrors: true,
                    });
                }
                // Local Development (Windows/Mac)
                else {
                    console.log("[PDFService] Launching Puppeteer for Local Dev...");
                    try {
                        const puppeteer = (await import('puppeteer')).default;
                        browser = await puppeteer.launch({
                            args: ['--no-sandbox'],
                            headless: true
                        });
                    } catch (pupErr) {
                        console.log("[PDFService] Default puppeteer failed, falling back to puppeteer-core with local paths...", pupErr.message);
                        const puppeteerCore = (await import('puppeteer-core')).default;
                        const fs = await import('fs');
                        const localPaths = [
                            "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
                            "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
                            "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
                            "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
                        ];

                        let executablePath = null;
                        for (const p of localPaths) {
                            if (fs.existsSync(p)) {
                                executablePath = p;
                                break;
                            }
                        }

                        if (!executablePath) {
                            throw new Error("Could not find a local Chrome/Edge installation to generate PDF.");
                        }

                        browser = await puppeteerCore.launch({
                            args: ['--no-sandbox'],
                            headless: true,
                            executablePath
                        });
                    }
                }

                console.log("[PDFService] Browser launched successfully.");
                this._browser = browser;

                // Cleanup on disconnect
                browser.on('disconnected', () => {
                    console.log("[PDFService] Browser instance disconnected.");
                    this._browser = null;
                    this._launchingPromise = null;
                });

                return browser;
            } catch (err) {
                console.error("[PDFService] CRITICAL: Browser launch failed:", err);
                this._browser = null;
                this._launchingPromise = null; // Reset so next request can try again
                throw err;
            } finally {
                this._launchingPromise = null;
            }
        })();

        return this._launchingPromise;
    }

    
    async generateReportBuffer(data) {
        const html = this._buildHTML(data);
        const { user } = data;
        const userName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || user?.email || "Participant";
        let page;

        try {
            const browser = await this._getBrowser();
            page = await browser.newPage();

            // DISABLE JS for 5x speed boost (template is static HTML)
            await page.setJavaScriptEnabled(false);

            // Set timeouts
            page.setDefaultNavigationTimeout(10000);
            page.setDefaultTimeout(10000);

            console.log("[PDFService] Rendering content...");
            await page.setContent(html, {
                waitUntil: 'load'
            });

            console.log("[PDFService] Printing PDF...");
            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
                displayHeaderFooter: false,
                timeout: 30000
            });

            return pdfBuffer;
        } catch (error) {
            console.error("PDF GENERATION ERROR:", error.message);
            if (error.message.includes('Browser closed') || error.message.includes('disconnected')) {
                this._browser = null;
                this._launchingPromise = null;
            }
            throw error;
        } finally {
            if (page) {
                await page.close().catch(e => console.error("Error closing page:", e));
            }
        }
    }

    _buildHTML(data) {
        const { report, user, aiInsight, isMasterReport, comparisonData } = data;
        const orgName = isMasterReport ? (data.orgName || user?.orgName || "Organization") : (user?.orgName || "Talent By Design");
        const orgLogo = data.orgLogo || user?.orgLogo || "";
        const userName = isMasterReport
            ? `${orgName} Intelligence Report`
            : (`${user?.firstName || ""} ${user?.lastName || ""}`.trim() || user?.email || "Participant");
        const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

        const pageHeader = `
            <div class="page-header">
                <div style="display: flex; align-items: center; gap: 1.5mm;">
                    <span style="color: #448CD2; font-weight: 800;">POD-360™</span>
                    <span style="opacity: 0.3;">|</span>
                    <span>Intelligence Report</span>
                </div>
                <div style="color: #1A3652; font-weight: 700; letter-spacing: 0.5px;">${userName}</div>
            </div>
        `;

        const pageFooter = `
            <div class="page-footer">
                <div style="font-weight: 400;">Confidential © Talent By Design</div>
                <div class="page-number" style="font-weight: 600; color: #64748B;"></div>
            </div>
        `;

        const templateSource = `
<!DOCTYPE html>
<html>
<head>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #1A3652;
            --secondary: #448CD2;
            --sidebar: #EDF5FD;
            --friction: #FF5656;
            --flow: #30AD43;
            --resistance: #FEE114;
            --text: #272727;
            --light-text: #5F6367;
            --border: #E2E8F0;
            --white: #FFFFFF;
            --accent: #F8FAFC;
            --primary-gradient: linear-gradient(135deg, #1A3652 0%, #448CD2 100%);
        }

        * { font-display: swap; box-sizing: border-box; }
        body { 
            margin: 0; 
            padding: 0; 
            background: #ffffff; 
            -webkit-print-color-adjust: exact; 
            font-family: 'Quicksand', sans-serif; 
            color: var(--light-text); 
            counter-reset: page;
        }

        .page { 
            width: 210mm; 
            height: 297mm; 
            position: relative; 
            display: flex; 
            flex-direction: column; 
            background: #ffffff; 
            page-break-after: always; 
            break-after: page;
            overflow: hidden;
            box-sizing: border-box;
            counter-increment: page;
        }

        .page-header {
            height: 12mm;
            padding: 0 15mm;
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 8pt;
            color: var(--light-text);
            text-transform: uppercase;
            letter-spacing: 1px;
            border-bottom: 0.5px solid #F1F5F9;
            flex-shrink: 0;
        }

        .page-footer {
            height: 12mm;
            padding: 0 15mm;
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 8pt;
            color: #94A3B8;
            border-top: 0.5px solid #F1F5F9;
            flex-shrink: 0;
        }

        .page-content {
            flex: 1;
            padding: 5mm 15mm;
            overflow: hidden;
        }

        .page-number::after { content: "PAGE " counter(page); }
        .page:first-of-type, .cover-page {
            page-break-before: avoid !important;
            break-before: avoid !important;
        }

        /* PDF Uniformity and Page Break Optimizations */
        h1, h2, h3, h4, h5 { 
            break-after: avoid; 
            page-break-after: avoid; 
        }

        /* Allow large cards to break if they have content, but keep smaller components together */
        .summary-hero, 
        .table-container, 
        .score-summary-box, 
        .sub-metric-box, 
        .highlight-box,
        .subdomain-header,
        .card-insight-box { 
            break-inside: avoid; 
            page-break-inside: avoid; 
        }

        /* Orphans and Widows prevention for text blocks */
        p, .bullet-item {
            orphans: 3;
            widows: 3;
        }

        /* Cover Page */
        .cover-page { 
            width: 210mm;
            height: 297mm;
            min-height: 297mm !important;
            padding: 0 !important; 
            display: flex; 
            flex-direction: column; 
            background: var(--primary);
            justify-content: center;
            align-items: center;
            overflow: hidden;
            position: relative;
            color: white;
            text-align: center;
            page-break-after: always;
            break-after: page;
        }
        
        .cover-accent-top {
            position: absolute;
            top: -150px;
            right: -150px;
            width: 400px;
            height: 400px;
            background: var(--secondary);
            opacity: 0.15;
            border-radius: 50%;
        }

        .blank-page .cover-accent-bottom {
            position: absolute;
            display: block;
            bottom: -150px;
            left: -150px;
            width: 400px;
            height: 400px;
            background: var(--secondary);
            opacity: 0.15;
            border-radius: 50%;
        }

        .cover-accent-bottom {
            position: absolute;
            bottom: -225px;
        display:none;
            width: 450px;
            height: 450px;
            background: var(--secondary);
            opacity: 0.1;
            border-radius: 50%;
        }

        .cover-logo-container {
            margin-bottom: 25mm;
            z-index: 10;
        }

        .logo-large {
            width: 70mm;
            filter: brightness(0) invert(1); /* Make logo white */
        }

        .cover-title-group {
            z-index: 10;
        }

        .cover-main-title {
            font-family: 'Quicksand', sans-serif;
            font-size: 64pt;
            font-weight: 900;
            line-height: 0.85;
            letter-spacing: -3px;
            margin-bottom: 5mm;
            text-transform: uppercase;
        }

        .cover-subtitle {
            font-family: 'Quicksand', sans-serif;
            font-size: 18pt;
            font-weight: 300;
            letter-spacing: 6px;
            text-transform: uppercase;
            opacity: 0.8;
            margin-bottom: 20mm;
        }

        .cover-decoration {
            width: 40mm;
            height: 1px;
            background: rgba(255,255,255,0.3);
            margin: 0 auto 15mm auto;
        }

        .cover-footer {
            position: absolute;
            bottom: 30mm;
            left: 20mm;
            right: 20mm;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10mm;
            border-top: 0.5px solid rgba(255,255,255,0.2);
            padding-top: 10mm;
            z-index: 10;
        }

        .footer-item {
            display: flex;
            flex-direction: column;
            gap: 1mm;
        }

        .footer-label {
            font-family: 'Quicksand', sans-serif;
            font-size: 7.5pt;
            font-weight: 700;
            color: rgba(255,255,255,0.5);
            text-transform: uppercase;
            letter-spacing: 1.5px;
        }

        .footer-value {
            font-family: 'Quicksand', sans-serif;
            font-size: 10.5pt;
            font-weight: 600;
            color: white;
        }

        /* Typography */
        /* Typography - Compact & Perfect */
        h1 { font-family: 'Quicksand', sans-serif; font-size: 17pt; font-weight: 800; color: var(--text); margin: 0 0 2mm 0; letter-spacing: -0.8px; line-height: 1.1; }
        h2 { font-family: 'Quicksand', sans-serif; font-size: 13pt; font-weight: 700; color: var(--text); margin: 4mm 0 0 0; letter-spacing: -0.4px; }

        /* Inner Cards - Compact */
        .card { 
            background: #f8fafc; 
            padding: 4mm 6mm; 
            border-radius: 3mm; 
            margin-bottom: 4mm; 
            border: 1px solid #e2e8f0; 
            position: relative; 
        }
        .card-insight {
            background: linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%);
            border-left: 5px solid var(--secondary);
            box-shadow: 0 10px 30px rgba(0,0,0,0.03);
        }
        .block-title { 
            font-family: 'Quicksand', sans-serif;
            font-weight: 700; 
            color: var(--secondary); 
            font-size: 9pt; 
            margin-bottom: 4mm; 
            text-transform: uppercase; 
            letter-spacing: 2px; 
        }

        /* Visuals */
        .summary-hero { 
            display: flex; 
            align-items: center; 
            gap: 10mm; 
            margin-bottom: 0mm; 
        }
        .visual-container { position: relative; width: 160px; height: 100px; flex-shrink: 0; }
        .gauge-val { position: absolute; top: 65%; left: 50%; transform: translate(-50%, -50%); font-size: 20pt; font-weight: 900; color: var(--primary); letter-spacing: -2px; font-family: 'Quicksand', sans-serif; }
        .gauge-label { position: absolute; top: 95%; left: 50%; transform: translate(-50%, -50%); font-size: 7.5pt; font-weight: 700; color: var(--secondary); text-transform: uppercase; letter-spacing: 2px; }

        /* Domain Header - Side-by-Side Flex */
        /* Fluid Intelligence Header - Branding Integrated */
        .domain-flex-header {
            display: flex;
            align-items: stretch;
            height: 46mm;
            margin-bottom: 10mm;
            background: var(--primary-gradient);
            border-radius: 8mm;
            position: relative;
            overflow: hidden;
            box-shadow: 0 15px 40px rgba(26, 54, 82, 0.15);
            border: 1px solid rgba(255,255,255,0.1);
        }
        /* Glossy Wave Overlay */
        .header-curve-accent {
            position: absolute;
            top: 0; left: 0; width: 70%; height: 100%;
            background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 100%);
            clip-path: ellipse(100% 120% at 0% 50%);
            z-index: 1;
        }
        .header-info-panel {
            flex: 1.6;
            padding: 8mm;
            display: flex;
            flex-direction: column;
            justify-content: center;
            position: relative;
            z-index: 2;
            color: white;
        }
        .header-info-panel h1 { 
            color: white; 
            margin: 0; 
            font-weight: 800; 
            letter-spacing: -0.8px; 
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header-info-panel .domain-desc { 
            font-size: 8.8pt; 
            color: rgba(255,255,255,0.8); 
            margin-top: 2mm; 
            line-height: 1.5; 
            font-weight: 400; 
            max-width: 90%;
        }
        .header-score-panel {
            flex: 1;
            background: rgba(255,255,255,0.98);
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            z-index: 2;
            border-left: 1px solid rgba(0,0,0,0.05);
            clip-path: polygon(10% 0, 100% 0, 100% 100%, 0 100%); /* Subtle angled entry */
        }
        .clean-gauge-wrapper {
            position: relative;
            width: 36mm;
            height: 36mm;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .score-inner-clean {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
        }
        .score-label-clean {
            font-size: 6.5pt;
            font-weight: 700;
            text-transform: uppercase;
            color: #94A3B8;
            letter-spacing: 2px;
            margin-bottom: 0.5mm;
        }
        .score-val-clean {
            font-size: 28pt;
            font-weight: 800;
            color: var(--primary);
            line-height: 1;
            letter-spacing: -1px;
        }
        .status-badge-clean {
            margin-top: 2mm;
            padding: 0.5mm 3mm;
            border-radius: 4mm;
            font-size: 6.5pt;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 1px;
            background: #f8fafc;
            border: 1px solid #E2E8F0;
            color: #64748B;
        }

        /* Tables - Compact */
        .table-container { margin: 3mm 0; border-radius: 3mm; overflow: hidden; border: 1px solid #f1f5f9; }
        .table { width: 100%; border-collapse: collapse; }
        .table th { background: #f8fafc; text-align: left; padding: 3mm 4mm; font-size: 6pt; font-weight: 700; color: var(--light-text); text-transform: uppercase; letter-spacing: 1.2px; border-bottom: 1px solid #f1f5f9; }
        .table td { padding: 3mm 4mm; border-bottom: 1px solid #f1f5f9; font-size: 6pt; color: var(--text); }
        .table tr:last-child td { border-bottom: none; }

        /* Status Badges */
        .badge { 
            display: inline-flex; 
            align-items: center; 
            padding: 1mm 3mm; 
            border-radius: 50px; 
            font-size: 6pt; 
            font-weight: 700; 
            text-transform: uppercase; 
            letter-spacing: 0.8px; 
            font-family: 'Quicksand', sans-serif;
        }
        .badge-high { background: #dcfce7; color: #166534; }
        .badge-medium { background: #fef9c3; color: #854d0e; }
        .badge-low { background: #fee2e2; color: #991b1b; }

        /* Bullet Lists - Compact */
        .bullet-list { list-style: none; padding: 0; margin: 0; }
        .bullet-item { display: flex; margin-bottom: 1.5mm; font-size: 10pt; align-items: flex-start; color: var(--text); line-height: 1.35; }
        .bullet-dot { 
            width: 6px; 
            height: 6px; 
            min-width: 6px;
            aspect-ratio: 1/1;
            background: var(--secondary); 
            border-radius: 50%; 
            margin-right: 4mm; 
            margin-top: 1.8mm; 
            flex-shrink: 0; 
        }

        .subdomain-analysis-card {
            background: transparent;
            border: none;
            border-radius: 0;
            padding: 0;
            margin-bottom: 4mm;
            box-shadow: none;
        }
        .subdomain-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 6mm;
            gap: 5mm;
        }
        .sub-metrics-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 10mm; 
            margin-top: 8mm;
        }
        .sub-metric-box {
            background: #f8fafc;
            padding: 5mm 6mm;
            border-radius: 3mm;
            border: 1px solid #e2e8f0;
        }
        .sub-metric-title { 
            font-family: 'Quicksand', sans-serif;
            font-size: 8.5pt; 
            font-weight: 700; 
            color: var(--primary); 
            text-transform: uppercase; 
            margin-bottom: 3mm; 
            letter-spacing: 1.2px; 
            display: flex;
            align-items: center;
            gap: 2mm;
        }

        .highlight-box {
            background: #eff6ff;
            border-radius: 3mm;
            padding: 5mm 6mm;
            margin-top: 8mm;
            border-left: 4px solid var(--secondary);
        }

        /* Top Priorities — executive summary block */
        .top-priorities-block {
            margin-top: 5mm;
            margin-bottom: 4mm;
            break-inside: avoid;
            page-break-inside: avoid;
        }
        .top-priorities-intro {
            font-size: 8pt;
            color: var(--light-text);
            line-height: 1.45;
            margin: 0 0 3mm 0;
        }
        .priority-item {
            background: #fff8f6;
            border: 1px solid #fecaca;
            border-left: 3.5px solid var(--friction);
            border-radius: 2.5mm;
            padding: 3mm 4mm;
            margin-bottom: 2.5mm;
            break-inside: avoid;
            page-break-inside: avoid;
        }
        .priority-item.priority-medium {
            background: #fffbeb;
            border-color: #fde68a;
            border-left-color: var(--resistance);
        }
        .priority-item-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 3mm;
            margin-bottom: 2mm;
        }
        .priority-rank-label {
            font-size: 6pt;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 1.2px;
            color: var(--friction);
            margin-bottom: 0.5mm;
        }
        .priority-area-name {
            font-family: 'Quicksand', sans-serif;
            font-size: 9pt;
            font-weight: 700;
            color: var(--primary);
            line-height: 1.25;
        }
        .priority-domain-name {
            font-size: 7pt;
            color: var(--light-text);
            margin-top: 0.5mm;
        }
        .priority-score-wrap {
            text-align: right;
            flex-shrink: 0;
        }
        .priority-score-val {
            font-family: 'Quicksand', sans-serif;
            font-size: 14pt;
            font-weight: 800;
            color: var(--friction);
            line-height: 1;
        }
        .priority-field-label {
            font-size: 6pt;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #94A3B8;
            margin: 1.5mm 0 0.5mm 0;
        }
        .priority-field-text {
            font-size: 7.5pt;
            line-height: 1.4;
            color: var(--text);
            margin: 0;
        }
        .priority-step-text {
            font-size: 7.5pt;
            line-height: 1.45;
            color: var(--text);
            font-weight: 400;
            margin: 0;
        }

        /* ── Executive Intelligence Dashboard (compact — matches domain pages) ── */
        .page-content.dashboard-content {
            padding: 3mm 15mm 3mm 15mm;
        }
        .dashboard-content h1,
        .dashboard-content h2,
        .dashboard-content .section-heading {
            margin: 0 0 1mm 0 !important;
        }
        .stack-section {
            margin-bottom: 2.5mm;
            width: 100%;
        }
        .stack-section:last-child {
            margin-bottom: 0;
        }
        .section-heading {
            font-family: 'Quicksand', sans-serif;
            font-size: 11pt;
            font-weight: 800;
            color: #1A3652;
            letter-spacing: -0.3px;
        }
        .section-heading-sub {
            font-size: 7pt;
            color: #94a3b8;
            line-height: 1.35;
            margin: 0 0 1.5mm 0;
        }
        .section-subtitle {
            font-size: 7.5pt;
            color: var(--light-text);
            line-height: 1.4;
            margin: 0 0 1.5mm 0;
        }
        .intro-block {
            margin-bottom: 2.5mm;
            padding-bottom: 2mm;
            border-bottom: 1px solid #f1f5f9;
        }

        .pod-model-card {
            border: 1px solid rgba(68, 140, 210, 0.2);
            border-radius: 2.5mm;
            padding: 2.5mm 3.5mm;
            background: #ffffff;
            break-inside: avoid;
            page-break-inside: avoid;
        }
        .pod-model-subtitle {
            font-size: 6.5pt;
            color: #64748B;
            font-weight: 500;
            margin: 0 0 1mm 0;
        }
        .pod-model-body {
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .pod-triangle-svg {
            width: 185px;
            height: 185px;
            display: block;
        }

        .exec-summary-card {
            border: 1px solid #e2e8f0;
            border-radius: 2.5mm;
            padding: 3mm 4mm;
            background: #ffffff;
            box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
            break-inside: avoid;
            page-break-inside: avoid;
        }
        .exec-summary-card > h2 {
            margin: 0 0 2mm 0 !important;
            font-size: 11pt;
            font-weight: 800;
            color: #1A3652;
        }
        .exec-summary-grid {
            display: flex;
            flex-direction: column;
            gap: 2mm;
        }
        .exec-metric-row {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 1.5mm;
        }
        .exec-metric {
            background: #fafbfc;
            border: 1px solid #edf2f7;
            border-radius: 2mm;
            padding: 2mm 2.5mm;
            min-height: 11mm;
        }
        .exec-metric-label {
            font-size: 5pt;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            color: #448CD2;
            margin-bottom: 0.8mm;
        }
        .exec-metric-value {
            font-size: 11pt;
            font-weight: 800;
            color: var(--primary);
            line-height: 1.05;
        }
        .health-strong { color: #166534; }
        .health-monitor { color: #854d0e; }
        .health-critical { color: #991b1b; }
        .risk-low { color: #166534; }
        .risk-moderate { color: #854d0e; }
        .risk-high { color: #991b1b; }

        .exec-lists-row {
            display: grid;
            grid-template-columns: 1fr 1px 1fr 1px 1fr;
            gap: 0;
            margin-top: 1.5mm;
            padding-top: 1.5mm;
            border-top: 1px solid #f1f5f9;
        }
        .exec-list-col {
            min-width: 0;
            padding: 0 3mm;
        }
        .exec-list-col:first-child { padding-left: 0; }
        .exec-list-col:last-child { padding-right: 0; }
        .exec-list-col-divider {
            background: #e2e8f0;
            width: 1px;
            align-self: stretch;
        }
        .exec-list-block { margin-top: 0; }
        .exec-list-title {
            font-size: 7pt;
            font-weight: 800;
            letter-spacing: 0.3px;
            margin-bottom: 1.2mm;
        }
        .exec-list-title-strengths {
            color: #16a34a;
            text-transform: none;
        }
        .exec-list-title-average {
            color: #ca8a04;
            text-transform: none;
        }
        .exec-list-title-opportunity {
            color: #ea580c;
            text-transform: none;
        }
        .exec-list-item-row {
            display: flex;
            align-items: flex-start;
            gap: 2mm;
            margin: 0 0 1mm 0;
        }
        .exec-list-item-row:last-child { margin-bottom: 0; }
        .exec-list-item-text {
            font-size: 7.5pt;
            line-height: 1.35;
            color: var(--text);
            font-weight: 500;
        }
        .exec-avg-value {
            font-size: 9pt;
            font-weight: 800;
            color: #166534;
            line-height: 1.2;
        }
        .exec-avg-value-average {
            font-size: 9pt;
            font-weight: 800;
            color: #ca8a04;
            line-height: 1.2;
        }
        .exec-opp-avg-value {
            font-size: 9pt;
            font-weight: 800;
            line-height: 1.2;
            color: #dc2626;
        }
        .exec-list-empty {
            font-size: 9pt;
            font-weight: 700;
            color: #cbd5e1;
            margin-left: 3.5mm;
            line-height: 1.2;
        }
        .exec-icon-average {
            background: #eab308;
            color: #ffffff;
            font-size: 8pt;
            font-weight: 800;
            line-height: 1;
        }
        .exec-list-subtext {
            font-size: 6.5pt;
            line-height: 1.3;
            color: #64748B;
            margin: 0.5mm 0 0 3.5mm;
            font-weight: 500;
        }
        .exec-domain-names {
            margin: 0.5mm 0 0 3.5mm;
        }
        .exec-domain-name {
            font-size: 6.5pt;
            line-height: 1.35;
            color: #64748B;
            font-weight: 500;
            margin: 0 0 0.4mm 0;
        }
        .exec-domain-name:last-child { margin-bottom: 0; }
        .exec-icon {
            width: 11px;
            height: 11px;
            flex-shrink: 0;
            margin-top: 0.5mm;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
        }
        .exec-icon-check {
            background: #16a34a;
            color: #ffffff;
            font-size: 7pt;
            font-weight: 800;
            line-height: 1;
        }
        .exec-icon-warn {
            color: #ffffff;
            font-size: 7pt;
            font-weight: 800;
            font-style: italic;
            line-height: 1;
        }
        .opp-warn-critical { background: #dc2626; }
        .opp-warn-moderate { background: #ea580c; }
        .opp-warn-attention { background: #f59e0b; }

        .priority-card-v2 {
            border: 1px solid #e5e7eb;
            border-left: 4px solid #fbbf24;
            border-radius: 2.5mm;
            padding: 2.5mm 3.5mm;
            margin-bottom: 2mm;
            background: #ffffff;
            box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
            break-inside: avoid;
            page-break-inside: avoid;
        }
        .priority-card-v2:last-child { margin-bottom: 0; }
        .priority-card-v2.priority-high { border-left-color: #ef4444; }
        .priority-card-v2.priority-medium { border-left-color: #fbbf24; }
        .priority-card-v2.priority-low { border-left-color: #22c55e; }
        .priority-card-v2-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 3mm;
            margin-bottom: 1.5mm;
            padding-bottom: 1.5mm;
            border-bottom: 1px solid #f8fafc;
        }
        .priority-rank-pill {
            font-size: 5pt;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            color: white;
            background: #ea580c;
            padding: 0.5mm 2mm;
            border-radius: 50px;
            display: inline-block;
            margin-bottom: 1mm;
        }
        .pill-high { background: #dc2626; }
        .pill-medium { background: #ea580c; }
        .pill-low { background: #16a34a; }
        .priority-area-name {
            font-family: 'Quicksand', sans-serif;
            font-size: 9.5pt;
            font-weight: 700;
            color: #1A3652;
            line-height: 1.2;
        }
        .priority-domain-name {
            font-size: 6.5pt;
            color: #94a3b8;
            margin-top: 0.3mm;
        }
        .priority-score-val {
            font-family: 'Quicksand', sans-serif;
            font-size: 15pt;
            font-weight: 800;
            color: #e11d48;
            line-height: 1;
        }
        .score-urgent { color: #e11d48; }
        .score-medium { color: #d97706; }
        .score-mild { color: #16a34a; }
        .dashboard-content .priority-field-label {
            font-size: 5.5pt;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #448CD2;
            margin: 1mm 0 0.3mm 0;
        }
        .dashboard-content .priority-field-text,
        .dashboard-content .priority-step-text {
            font-size: 7pt;
            line-height: 1.35;
        }

        .portfolio-block {
            border: 1px solid #e2e8f0;
            border-radius: 2.5mm;
            padding: 2.5mm 3.5mm;
            background: #f8fafc;
            break-inside: avoid;
            page-break-inside: avoid;
        }
        .portfolio-row {
            display: flex;
            align-items: center;
            gap: 4mm;
            margin-top: 1mm;
        }
        .portfolio-gauge {
            width: 130px !important;
            height: 82px !important;
            flex-shrink: 0;
        }
        .portfolio-gauge .gauge-val {
            font-size: 16pt;
        }
        .portfolio-gauge .gauge-label {
            font-size: 6pt;
            letter-spacing: 1px;
        }
        .portfolio-block-text {
            font-size: 7.5pt;
            line-height: 1.4;
            color: var(--light-text);
            text-align: left;
            margin: 0;
            flex: 1;
        }

        .insight-card-v2 {
            border: 1px solid #e2e8f0;
            border-radius: 2mm;
            padding: 2mm 3mm;
            margin-bottom: 1.5mm;
            background: white;
            break-inside: avoid;
            page-break-inside: avoid;
        }
        .insight-card-v2:last-child { margin-bottom: 0; }
        .insight-card-v2-title {
            font-size: 7.5pt;
            font-weight: 700;
            color: var(--primary);
            margin-bottom: 0.5mm;
        }
        .insight-card-v2-text {
            font-size: 7pt;
            line-height: 1.35;
            color: var(--light-text);
            margin: 0;
        }

        .state-strength { background: #dcfce7; color: #166534; }
        .state-monitor { background: #fef9c3; color: #854d0e; }
        .state-attention { background: #fee2e2; color: #991b1b; }
        .gap-positive { color: #166534; font-weight: 700; }
        .gap-negative { color: #991b1b; font-weight: 700; }

        .rec-card-v2 {
            border: 1px solid #e2e8f0;
            border-radius: 2mm;
            padding: 2mm 3mm;
            margin-bottom: 1.5mm;
            background: white;
            break-inside: avoid;
            page-break-inside: avoid;
        }
        .rec-card-v2:last-child { margin-bottom: 0; }
        .rec-card-v2-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 2mm;
            margin-bottom: 0.8mm;
        }
        .rec-card-v2-title { font-size: 8pt; font-weight: 700; color: var(--primary); }
        .focus-pill {
            font-size: 5.5pt;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            padding: 0.6mm 2mm;
            border-radius: 50px;
        }
        .focus-continue { background: #dcfce7; color: #166534; }
        .focus-optimize { background: #fef9c3; color: #854d0e; }
        .focus-accelerate { background: #fee2e2; color: #991b1b; }
        .rec-card-v2-text {
            font-size: 7pt;
            line-height: 1.35;
            color: var(--light-text);
            margin: 0;
        }

        .roadmap-card {
            border: 1px solid #e2e8f0;
            border-radius: 2.5mm;
            padding: 2.5mm 3.5mm;
            background: #f8fafc;
            break-inside: avoid;
            page-break-inside: avoid;
        }
        .roadmap-phase {
            margin-bottom: 2mm;
            break-inside: avoid;
            page-break-inside: avoid;
        }
        .roadmap-phase:last-child { margin-bottom: 0; }
        .roadmap-phase-label {
            font-size: 6.5pt;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: var(--secondary);
            margin-bottom: 0.8mm;
        }
        .roadmap-item {
            font-size: 7pt;
            line-height: 1.35;
            color: var(--text);
            margin: 0 0 0.5mm 0;
            padding-left: 3.5mm;
            position: relative;
        }
        .roadmap-item::before {
            content: "•";
            position: absolute;
            left: 0;
            color: var(--secondary);
        }

        .takeaway-stack { display: flex; flex-direction: column; gap: 1.5mm; }
        .takeaway-item-v2 {
            border: 1px solid #e2e8f0;
            border-radius: 2mm;
            padding: 2mm 3mm;
            background: white;
            break-inside: avoid;
            page-break-inside: avoid;
        }
        .takeaway-item-v2-title {
            font-size: 6.5pt;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            color: var(--secondary);
            margin-bottom: 0.5mm;
        }
        .takeaway-item-v2-text {
            font-size: 7pt;
            line-height: 1.35;
            color: var(--text);
            margin: 0;
        }

        .trend-banner {
            margin-top: 1.5mm;
            padding: 1.5mm 2.5mm;
            border-radius: 1.5mm;
            background: #edf5fd;
            font-size: 7pt;
            color: var(--primary);
            font-weight: 600;
            line-height: 1.35;
        }
        .dashboard-content .table-container {
            margin: 1mm 0 0 0;
            break-inside: auto;
            page-break-inside: auto;
        }
        .dashboard-content .table th,
        .dashboard-content .table td {
            padding: 2mm 2.5mm;
            font-size: 6.5pt;
        }
        .trend-up { color: #166534; }
        .trend-stable { color: #854d0e; }
        .trend-down { color: #991b1b; }

        .flow-text {
            break-inside: auto;
            page-break-inside: auto;
            orphans: 2;
            widows: 2;
        }
        .dashboard-content .table tr {
            break-inside: avoid;
            page-break-inside: avoid;
        }
        .continued-label {
            font-size: 6.5pt;
            color: #94a3b8;
            font-style: italic;
            margin-bottom: 1mm;
        }

        /* Premium Sub-Domain Cards */
        .premium-card {
            background: var(--sidebar);
            border-radius: 4mm;
            padding: 6mm 8mm 6mm 10mm; /* Added left padding for the bar */
            margin-bottom: 8mm;
            box-shadow: 0 4px 20px rgba(0,0,0,0.02);
            border: 0.5px solid #F1F5F9;
            break-inside: avoid;
            position: relative;
        }
        .premium-card::before {
            content: "";
            position: absolute;
            left: 0;
            top: 6mm;
            bottom: 6mm;
            width: 4px;
            background: var(--secondary);
            border-radius: 5px; /* Full pill shape */
        }
        .premium-card.primary {
            background: #f1f5f9;
        }
        .premium-card.primary::before {
            background: var(--primary);
        }
        .premium-card.secondary {
            background: var(--sidebar);
        }
        .premium-card.secondary::before {
            background: var(--secondary);
        }
        .premium-card-title {
            font-family: 'Quicksand', sans-serif;
            font-weight: 700;
            font-size: 10pt;
            color: var(--text);
            text-transform: capitalize;
            margin-bottom: 2mm;
        }
    </style>
</head>
<body>
    <!-- COVER PAGE -->
    <div class="page cover-page">
        <div class="cover-accent-top"></div>
        <div class="cover-accent-bottom"></div>
        
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; z-index: 10; margin-top: -15mm;">
            <!-- Logo at Top (White Instance) -->
            <img src="${BRAND_LOGO_URL}" style="width: 70mm; height: auto; object-fit: contain; filter: brightness(0) invert(1); margin-bottom: 10mm;" />
            
            <!-- Heading in Middle -->
            <div style="font-family: 'Quicksand', sans-serif; font-weight: 700; font-size: 64pt; color: white; letter-spacing: -1px; line-height: 1; margin-bottom: 5mm;">POD-360™</div>
            
            <!-- Subtitle -->
            <div style="font-family: 'Quicksand', sans-serif; font-weight: 400; font-size: 14pt; color: rgba(255,255,255,0.8); letter-spacing: 8px; text-transform: uppercase;">Performance Intelligence</div>
            
            <!-- Bottom Divider -->
            <div style="width: 40mm; height: 1px; background: rgba(255,255,255,0.3); margin-top: 35mm;"></div>
        </div>

        <div class="cover-title-group" style="display: none;">
            <!-- Hidden original group to avoid layout shifts -->
            <div class="cover-subtitle">Performance Intelligence</div>
            <div class="cover-decoration"></div>
        </div>

        <div class="cover-footer">
            <div class="footer-item">
                <div class="footer-label">Prepared For</div>
                <div class="footer-value">{{userName}}</div>
            </div>
            <div class="footer-item">
                <div class="footer-label">Organization</div>
                <div class="footer-value">{{orgName}}</div>
            </div>
            <div class="footer-item">
                <div class="footer-label">Issue Date</div>
                <div class="footer-value">{{dateStr}}</div>
            </div>
        </div>
    </div>

    {{#unless isMasterReport}}
    <!-- INTELLIGENCE DASHBOARD — PAGE 1 -->
    <div class="page">
        ${pageHeader}
        <div class="page-content dashboard-content">
            <section class="stack-section intro-block">
                <h1 style="margin-bottom: 1mm;">The Data Synergy</h1>
                <p class="section-subtitle">{{synergyIntro}}</p>
                <p style="font-family: 'Quicksand', sans-serif; font-weight: 700; color: var(--secondary); font-size: 8.5pt; margin: 1mm 0 0.5mm 0;">Assessed Role: {{synergyRole.name}}</p>
                <p class="section-subtitle" style="margin-bottom: 0;">{{synergyRole.description}}</p>
            </section>

            <section class="stack-section exec-summary-card">
                <h2>Executive Summary</h2>
                <div class="exec-summary-grid">
                    <div class="exec-metric-row">
                        <div class="exec-metric">
                            <div class="exec-metric-label">Overall Health</div>
                            <div class="exec-metric-value {{dashboard.healthClass}}">{{dashboard.overallHealth}}</div>
                        </div>
                        <div class="exec-metric">
                            <div class="exec-metric-label">Portfolio Score</div>
                            <div class="exec-metric-value" style="color: {{dashboard.portfolioColor}};">{{dashboard.portfolioScore}}%</div>
                            <div style="font-size: 6pt; color: #94a3b8; margin-top: 0.5mm;">{{dashboard.portfolioClass}} Efficiency</div>
                        </div>
                        <div class="exec-metric">
                            <div class="exec-metric-label">Percentile Rank</div>
                            <div class="exec-metric-value" style="font-size: 9pt; line-height: 1.2;">{{dashboard.percentileLabel}}</div>
                        </div>
                        <div class="exec-metric">
                            <div class="exec-metric-label">Risk Level</div>
                            <div class="exec-metric-value {{dashboard.riskClass}}">{{dashboard.riskLevel}}</div>
                            <div style="font-size: 6pt; color: #94a3b8; margin-top: 0.5mm;">Organizational Risk</div>
                        </div>
                    </div>
                    <div class="exec-lists-row">
                        <div class="exec-list-col">
                            <div class="exec-list-block">
                                <div class="exec-list-title exec-list-title-strengths">Strength</div>
                                {{#if dashboard.strengthSummary}}
                                <div class="exec-list-item-row">
                                    <span class="exec-icon exec-icon-check">✓</span>
                                    <span class="exec-list-item-text">
                                        <span class="exec-avg-value">{{dashboard.strengthSummary.avg}}%</span> Domain Average
                                    </span>
                                </div>
                                <div class="exec-domain-names">
                                    {{#each dashboard.strengthSummary.domainNames}}
                                    <div class="exec-domain-name">{{this}}</div>
                                    {{/each}}
                                </div>
                                {{else}}
                                <div class="exec-list-empty">—</div>
                                <div class="exec-list-subtext">75–100% range</div>
                                {{/if}}
                            </div>
                        </div>
                        <div class="exec-list-col-divider"></div>
                        <div class="exec-list-col">
                            <div class="exec-list-block">
                                <div class="exec-list-title exec-list-title-average">Average</div>
                                {{#if dashboard.averageSummary}}
                                <div class="exec-list-item-row">
                                    <span class="exec-icon exec-icon-average">~</span>
                                    <span class="exec-list-item-text">
                                        <span class="exec-avg-value-average">{{dashboard.averageSummary.avg}}%</span> Domain Average
                                    </span>
                                </div>
                                <div class="exec-domain-names">
                                    {{#each dashboard.averageSummary.domainNames}}
                                    <div class="exec-domain-name">{{this}}</div>
                                    {{/each}}
                                </div>
                                {{else}}
                                <div class="exec-list-empty">—</div>
                                <div class="exec-list-subtext">50–75% range</div>
                                {{/if}}
                            </div>
                        </div>
                        <div class="exec-list-col-divider"></div>
                        <div class="exec-list-col">
                            <div class="exec-list-block">
                                <div class="exec-list-title exec-list-title-opportunity">Primary Opportunity</div>
                                {{#if dashboard.opportunitySummary}}
                                <div class="exec-list-item-row">
                                    <span class="exec-icon exec-icon-warn opp-warn-critical">!</span>
                                    <span class="exec-list-item-text">
                                        <span class="exec-opp-avg-value">{{dashboard.opportunitySummary.avg}}%</span> Domain Average
                                    </span>
                                </div>
                                <div class="exec-domain-names">
                                    {{#each dashboard.opportunitySummary.domainNames}}
                                    <div class="exec-domain-name">{{this}}</div>
                                    {{/each}}
                                </div>
                                {{else}}
                                <div class="exec-list-empty">—</div>
                                <div class="exec-list-subtext">Below 50% range</div>
                                {{/if}}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section class="stack-section portfolio-block">
                <h2 class="section-heading">Portfolio Score</h2>
                <div class="portfolio-row">
                    <div class="visual-container portfolio-gauge">
                        <svg width="130" height="82" viewBox="0 0 200 110">
                            <defs>
                                <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" style="stop-color:{{gaugeColor report.scores.overall}};stop-opacity:0.7" />
                                    <stop offset="100%" style="stop-color:{{gaugeColor report.scores.overall}};stop-opacity:1" />
                                </linearGradient>
                            </defs>
                            <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#f1f5f9" stroke-width="18" stroke-linecap="round" />
                            <path d="M 20 100 A 80 80 0 0 1 {{gaugePath 80 report.scores.overall}}" fill="none" stroke="url(#gaugeGradient)" stroke-width="18" stroke-linecap="round" />
                            <circle cx="{{gaugePathX 80 report.scores.overall}}" cy="{{gaugePathY 80 report.scores.overall}}" r="7" fill="white" stroke="{{gaugeColor report.scores.overall}}" stroke-width="4" />
                        </svg>
                        <div class="gauge-val">{{round report.scores.overall}}%</div>
                        <div class="gauge-label">{{getClassification report.scores.overall}}</div>
                    </div>
                    <p class="portfolio-block-text">Your consolidated performance score is <strong style="color: var(--secondary);">{{round report.scores.overall}}%</strong>, indicating <strong style="color: {{gaugeColor report.scores.overall}};">{{getClassification report.scores.overall}} Efficiency</strong> across your organizational footprint.</p>
                </div>
            </section>

            {{#if prioritiesPageOne.length}}
            <section class="stack-section">
                <h2 class="section-heading">Top Priorities</h2>
                <p class="section-heading-sub">Ranked by urgency — address these before reviewing detailed domain sections.</p>
                {{#each prioritiesPageOne}}
                <div class="priority-card-v2 {{cardClass}}">
                    <div class="priority-card-v2-header">
                        <div style="flex: 1; min-width: 0;">
                            <span class="priority-rank-pill {{pillClass}}">{{rank}} · {{urgencyLabel}} Priority</span>
                            <div class="priority-area-name">{{area}}</div>
                            <div class="priority-domain-name">{{domain}}</div>
                        </div>
                        <div class="priority-score-val {{scoreColorClass}}">{{score}}%</div>
                    </div>
                    <div class="priority-field-label">Issue</div>
                    <p class="priority-field-text flow-text">{{issue}}</p>
                    <div class="priority-field-label">Impact</div>
                    <p class="priority-field-text flow-text">{{impact}}</p>
                    <div class="priority-field-label">First Recommended Step</div>
                    <p class="priority-step-text flow-text">{{recommendedStep}}</p>
                </div>
                {{/each}}
            </section>
            {{/if}}
        </div>
        ${pageFooter}
    </div>

    <!-- INTELLIGENCE DASHBOARD — PAGE 2 -->
    <div class="page">
        ${pageHeader}
        <div class="page-content dashboard-content">
            {{#if hasPrioritiesContinued}}
            <section class="stack-section">
                {{#each prioritiesPageTwo}}
                <div class="priority-card-v2 {{cardClass}}">
                    <div class="priority-card-v2-header">
                        <div style="flex: 1; min-width: 0;">
                            <span class="priority-rank-pill {{pillClass}}">{{rank}} · {{urgencyLabel}} Priority</span>
                            <div class="priority-area-name">{{area}}</div>
                            <div class="priority-domain-name">{{domain}}</div>
                        </div>
                        <div class="priority-score-val {{scoreColorClass}}">{{score}}%</div>
                    </div>
                    <div class="priority-field-label">Issue</div>
                    <p class="priority-field-text flow-text">{{issue}}</p>
                    <div class="priority-field-label">Impact</div>
                    <p class="priority-field-text flow-text">{{impact}}</p>
                    <div class="priority-field-label">First Recommended Step</div>
                    <p class="priority-step-text flow-text">{{recommendedStep}}</p>
                </div>
                {{/each}}
            </section>
            {{/if}}

            <section class="stack-section">
                <h2 class="section-heading">AI Insights</h2>
                {{#each dashboard.aiInsights}}
                <div class="insight-card-v2">
                    <div class="insight-card-v2-title">{{title}} · {{score}}%</div>
                    <p class="insight-card-v2-text flow-text">{{text}}</p>
                </div>
                {{/each}}
            </section>

            <section class="stack-section">
                <h2 class="section-heading">Domain Analysis Matrix</h2>
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Strategic Domain</th>
                                <th>Efficiency</th>
                                <th>Current State</th>
                                <th>Benchmark</th>
                                <th>Gap</th>
                            </tr>
                        </thead>
                        <tbody>
                            {{#each dashboard.domainMatrix}}
                            <tr>
                                <td style="font-weight: 700; color: var(--primary);">{{name}}</td>
                                <td style="font-weight: 800; color: var(--secondary);">{{score}}%</td>
                                <td><span class="badge {{stateClass}}">{{stateLabel}}</span></td>
                                <td>{{#if benchmark}}{{benchmark}}%{{else}}—{{/if}}</td>
                                <td class="{{gapClass}}">{{gapLabel}}</td>
                            </tr>
                            {{/each}}
                        </tbody>
                    </table>
                </div>
                <div class="trend-banner">Overall Trend: <span class="{{dashboard.trendClass}}">{{dashboard.overallTrend}}</span> — review priority actions below to sustain or improve momentum.</div>
            </section>

            <section class="stack-section">
                <h2 class="section-heading">Recommendations</h2>
                {{#each dashboard.recommendations}}
                <div class="rec-card-v2">
                    <div class="rec-card-v2-header">
                        <div class="rec-card-v2-title">{{name}}</div>
                        <span class="focus-pill {{focusClass}}">Focus: {{focus}}</span>
                    </div>
                    <p class="rec-card-v2-text flow-text">{{description}}</p>
                </div>
                {{/each}}
            </section>

            <section class="stack-section pod-model-card">
                <h2 class="section-heading">POD-360™ Model Performance Intelligence</h2>
                <p class="pod-model-subtitle">Interconnectivity of focus areas</p>
                <div class="pod-model-body">
                    <svg viewBox="0 0 300 300" class="pod-triangle-svg" xmlns="http://www.w3.org/2000/svg">
                        <polygon points="{{triangle.sectorOS}}" fill="#EDF5FD" />
                        <polygon points="{{triangle.sectorDF}}" fill="#C7E0F8" />
                        <polygon points="{{triangle.sectorPP}}" fill="#3C7CBA" />
                        <polygon points="{{triangle.outline}}" fill="none" stroke="#E2E8F0" stroke-width="1" stroke-dasharray="4 2" />
                        <text x="{{triangle.labelPP.x}}" y="{{triangle.labelPP.y}}" text-anchor="middle" font-family="Quicksand, sans-serif" font-weight="800" fill="#1E293B" font-size="9">
                            <tspan x="{{triangle.labelPP.x}}" dy="0">PEOPLE POTENTIAL</tspan>
                            <tspan x="{{triangle.labelPP.x}}" dy="1.1em" font-size="12">({{triangle.ppScore}}%)</tspan>
                        </text>
                        <text x="{{triangle.labelOS.x}}" y="{{triangle.labelOS.y}}" text-anchor="middle" font-family="Quicksand, sans-serif" font-weight="800" fill="#1E293B" font-size="9">
                            <tspan x="{{triangle.labelOS.x}}" dy="0">OPERATIONAL</tspan>
                            <tspan x="{{triangle.labelOS.x}}" dy="1.1em">STEADINESS</tspan>
                            <tspan x="{{triangle.labelOS.x}}" dy="1.1em" font-size="12">({{triangle.osScore}}%)</tspan>
                        </text>
                        <text x="{{triangle.labelDF.x}}" y="{{triangle.labelDF.y}}" text-anchor="middle" font-family="Quicksand, sans-serif" font-weight="800" fill="#1E293B" font-size="9">
                            <tspan x="{{triangle.labelDF.x}}" dy="0">DIGITAL</tspan>
                            <tspan x="{{triangle.labelDF.x}}" dy="1.1em">FLUENCY</tspan>
                            <tspan x="{{triangle.labelDF.x}}" dy="1.1em" font-size="12">({{triangle.dfScore}}%)</tspan>
                        </text>
                    </svg>
                </div>
            </section>
        </div>
        ${pageFooter}
    </div>

    <!-- INTELLIGENCE DASHBOARD — PAGE 3 -->
    <div class="page">
        ${pageHeader}
        <div class="page-content dashboard-content">
            <section class="stack-section roadmap-card">
                <h2 class="section-heading">90-Day Action Roadmap</h2>
                <div class="roadmap-phase">
                    <div class="roadmap-phase-label">0–30 Days · Quick Wins</div>
                    {{#each dashboard.roadmap.quick}}
                    <p class="roadmap-item flow-text">{{this}}</p>
                    {{/each}}
                </div>
                <div class="roadmap-phase">
                    <div class="roadmap-phase-label">31–90 Days · Short-Term Initiatives</div>
                    {{#each dashboard.roadmap.shortTerm}}
                    <p class="roadmap-item flow-text">{{this}}</p>
                    {{/each}}
                </div>
                <div class="roadmap-phase">
                    <div class="roadmap-phase-label">90+ Days · Strategic Initiatives</div>
                    {{#each dashboard.roadmap.strategic}}
                    <p class="roadmap-item flow-text">{{this}}</p>
                    {{/each}}
                </div>
            </section>

            <section class="stack-section">
                <h2 class="section-heading">Key Takeaways</h2>
                <div class="takeaway-stack">
                    {{#each dashboard.takeaways}}
                    <div class="takeaway-item-v2">
                        <div class="takeaway-item-v2-title">{{title}}</div>
                        <p class="takeaway-item-v2-text flow-text">{{text}}</p>
                    </div>
                    {{/each}}
                </div>
            </section>
        </div>
        ${pageFooter}
    </div>

    {{#each domainPages}}
    {{#each subdomainPages}}
    <!-- DOMAIN ANALYSIS PAGE -->
    <div class="page">
        ${pageHeader}
        <div class="page-content">
            {{#if @first}}
            <div class="domain-flex-header">
                <div class="header-curve-accent"></div>
                <div class="header-info-panel">
                    <h1>{{../name}}</h1>
                    <div class="domain-desc">{{../description}}</div>
                </div>

                <div class="header-score-panel">
                    <div class="clean-gauge-wrapper">
                        <svg width="100%" height="100%" viewBox="0 0 100 100" style="transform: rotate(-90deg); position: absolute;">
                            <!-- Sophisticated Minimalist Track -->
                            <circle cx="50" cy="50" r="44" fill="none" stroke="#F1F5F9" stroke-width="3" />
                            <!-- Clean Progress Track -->
                            <circle cx="50" cy="50" r="44" fill="none" stroke="{{gaugeColor ../score}}" stroke-width="3" stroke-dasharray="276" stroke-dashoffset="{{calcGaugeOffset ../score}}" stroke-linecap="round" />
                        </svg>
                        <div class="score-inner-clean">
                            <div class="score-label-clean">Efficiency</div>
                            <div class="score-val-clean">{{round ../score}}%</div>
                            <div class="status-badge-clean" style="border-color: {{gaugeColor ../score}}; color: {{gaugeColor ../score}}; background: #ffffff;">{{getClassification ../score}}</div>
                        </div>
                    </div>
                </div>
            </div>
            {{/if}}

            <!-- SUBDOMAINS -->
            {{#each this}}
            <div class="subdomain-analysis-card">
                <div class="subdomain-header">
                    <div>
                        <div style="font-family: 'Quicksand', sans-serif; font-size: 6pt; color: var(--secondary); font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 1.5mm;">Sub-Domain Focus</div>
                        <div style="display: flex; align-items: center; gap: 3mm; margin-bottom: 2mm;">
                            {{#if icon}}
                            <img src="{{icon}}" style="width: 32px; height: 32px; object-fit: contain; flex-shrink: 0; image-rendering: -webkit-optimize-contrast;" />
                            {{/if}}
                            <h2 style="margin: 0; border: none; padding: 0;">{{name}}</h2>
                        </div>
                        <p style="font-size: 9pt; line-height: 1.5; color: var(--text); margin-top: 0; margin-bottom: 0mm;">{{description}}</p>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-family: 'Quicksand', sans-serif; font-size: 18pt; font-weight: 800; color: var(--secondary); line-height: 1;">{{round score}}%</div>
                        <div class="badge badge-{{toLowerCase state}}" style="margin-top: 2mm;">{{state}}</div>
                    </div>
                </div>

                <!-- POD-360 INSIGHT (per subdomain) -->
                {{#if modelDescription}}
                <div style="margin-bottom: 4mm;">
                    <div class="premium-card-title">POD-360&#8482; Model</div>
                    {{#each modelDescription}}
                    <div style="display: flex; align-items: flex-start; gap: 4mm; margin-bottom: 2mm;">
                        <div style="width: 4px; height: 4px; background: var(--light-text); border-radius: 50%; flex-shrink: 0; margin-top: 1.8mm;"></div>
                        <div style="font-size: 9pt; line-height: 1.35; color: var(--light-text);">{{this}}</div>
                    </div>
                    {{/each}}
                </div>
                {{/if}}

                <div style="margin-bottom: 4mm;">
                    <div class="premium-card-title">Contextual Insight</div>
                    {{#each insight}}
                    <div style="display: flex; align-items: flex-start; gap: 4mm; margin-bottom: 2mm;">
                        <div style="width: 4px; height: 4px; background: var(--light-text); border-radius: 50%; flex-shrink: 0; margin-top: 1.8mm;"></div>
                        <div style="font-size: 9pt; line-height: 1.35; color: var(--light-text);">{{this}}</div>
                    </div>
                    {{/each}}
                </div>

                <div style="margin-bottom: 4mm;">
                    <div class="premium-card-title">Coaching & Development</div>
                    {{#each coaching}}
                    <div style="display: flex; align-items: flex-start; gap: 4mm; margin-bottom: 2mm;">
                        <div style="width: 4px; height: 4px; background: var(--light-text); border-radius: 50%; flex-shrink: 0; margin-top: 1.8mm;"></div>
                        <div style="font-size: 9pt; line-height: 1.35; color: var(--light-text);">{{this}}</div>
                    </div>
                    {{/each}}
                    {{#unless coaching.length}}
                    <p style="font-size: 9.5pt; color: var(--light-text); font-style: italic;">Coaching recommendations will be updated based on future performance cycles.</p>
                    {{/unless}}
                </div>

                {{#if recommendedPrograms.length}}
                <div style="margin-bottom: 4mm;">
                    <div class="premium-card-title">Recommended Programs & Initiatives</div>
                    <div style="display: flex; flex-direction: column; gap: 1mm;">
                        {{#each recommendedPrograms}}
                        <div style="display: flex; align-items: flex-start; gap: 4mm; margin-bottom: 1.5mm;">
                            <div style="width: 4px; height: 4px; background: var(--light-text); border-radius: 50%; flex-shrink: 0; margin-top: 1.8mm;"></div>
                            <div style="font-size: 9pt; line-height: 1.35; color: var(--light-text); font-weight: 500;">{{this}}</div>
                        </div>
                        {{/each}}
                    </div>
                </div>
                {{/if}}
            </div>
            {{/each}}
        </div>
        ${pageFooter}
    </div>
    {{/each}}

    <!-- AGGREGATED DOMAIN OKRS PAGE -->
    {{#if aggregatedOKRs.length}}
    <div class="page">
        ${pageHeader}
        <div class="page-content">
            <!-- OKR Header - matches Sub-Domain Focus style exactly -->
            <div style="margin-bottom: 7mm;">
                <div style="font-family: 'Quicksand', sans-serif; font-size: 6pt; color: var(--secondary); font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 2mm;">Strategic Roadmap</div>
                <h2 style="margin: 0; border: none; padding: 0; color: var(--text); line-height: 1.3;">
                    {{name}}: <br/>
                    <span style="font-size: 11pt; color: var(--secondary); font-weight: 600;">Suggested Objectives & Key Results (OKRs)</span>
                </h2>
                <p style="font-size: 8pt; line-height: 1.35; color: var(--light-text); margin-top: 1mm; margin-bottom: 0;">
                    The assessment results provide insight into areas where focused action may improve organizational performance, collaboration, and transformation outcomes. The following OKR suggestions are intended to guide coaching discussions and planning. Additional OKRs can be added and all should be tailored collaboratively to ensure alignment with organizational priorities.
                </p>
            </div>

            <div class="sub-metrics-aggregated" style="width: 100%; margin-top: 5mm;">
                {{#each aggregatedOKRs}}
                <div style="margin-bottom: 0mm; position: relative;">
                    <!-- Creative Roadmap Connector -->
                    {{#unless @last}}<div style="position: absolute; top: 5mm; left: 7px; bottom: -4mm; width: 1px; background: repeating-linear-gradient(to bottom, #E2E8F0 0, #E2E8F0 4px, transparent 4px, transparent 8px);"></div>{{/unless}}
                    
                    <div style="display: flex; align-items: center; gap: 4mm; margin-bottom: 0mm;">
                        <div style="width: 14px; height: 14px; border: 1px solid var(--primary); border-radius: 50%; background: white; flex-shrink: 0; position: relative; z-index: 1;">
                            <div style="position: absolute; top: 3px; left: 3px; width: 6px; height: 6px; background: var(--secondary); border-radius: 50%;"></div>
                        </div>
                        <div style="font-size: 11pt; font-weight: 700; color: var(--text);">{{subdomainName}}</div>
                    </div>

                    <div style="padding-left: 8mm;">
                        {{#if okrs.focus}}
                        <div style="font-size: 9pt; color: var(--light-text); line-height: 1.5; margin-bottom: 2mm; font-weight: 500; margin-top: 1mm;">
                            {{okrs.focus}}
                        </div>
                        {{/if}}

                    <ul class="bullet-list" style="margin-left: 0; list-style: none; padding: 0;">

                        {{#each okrs.list}}
                        <li style="margin-bottom: 4mm; display: flex; align-items: flex-start; gap: 3mm;">
                            <div style="font-size: 10pt; font-weight: 700; color: var(--text); flex-shrink: 0; padding-top: 1px;">{{add @index 1}}.</div>
                            <div style="flex: 1;">
                                <div style="font-size: 10pt; font-weight: 700; color: var(--text); margin-bottom: 1.5mm; line-height: 1.4;">{{title}}</div>
                                
                                    <div style="display: flex; flex-direction: column; gap: 1.5mm;">
                                        {{#each keyResults}}
                                        <div style="display: flex; align-items: flex-start; gap: 3mm; font-size: 8pt; color: var(--light-text); line-height: 1.35;">
                                            <div style="width: 4px; height: 4px; background: var(--light-text); border-radius: 50%; margin-top: 1.5mm; flex-shrink: 0;"></div>
                                            {{this}}
                                        </div>
                                        {{/each}}
                                    </div>
                            </div>
                        </li>
                        {{/each}}
                    </ul>
                </div>
                </div>
                {{/each}}
            </div>
        </div>
        ${pageFooter}
    </div>
    {{/if}}
    {{/each}}
    {{/unless}}

    <!-- FINAL BLANK PAGE -->
    <div class="page cover-page blank-page">
        <div class="cover-accent-top"></div>
        <div class="cover-accent-bottom"></div>
        
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; width: 100%; z-index: 10;">
            <div style="display: flex; flex-direction: column; align-items: center; gap: 10mm; z-index: 10;">
                <div style="font-family: 'Outfit', sans-serif; font-size: 11pt; color: rgba(255,255,255,0.7); letter-spacing: 3px; text-transform: uppercase;">A Partnership for Growth</div>
                <div style="display: flex; align-items: center; justify-content: center; gap: 12mm;">
                    <!-- POD Tree Logo -->
                    <img src="${REPORT_BACK_COVER_URL}" style="width: 50mm; height: auto; object-fit: contain;" />
                    
                    <!-- Synergy Icon (Handshake) -->
                    <div style="width: 15mm; display: flex; align-items: center; justify-content: center;">
                        <img src="https://res.cloudinary.com/dfpkn8g8h/image/upload/v1778750772/fluent-emoji-high-contrast_handshake_zqxoav.png" style="width: 25px; height: 25px; filter: brightness(0) invert(1); opacity: 0.8;" />
                    </div>
                    
                    {{#if orgLogo}}
                    <img src="{{orgLogo}}" style="width: 50mm; height: auto; object-fit: contain;" />
                    {{/if}}
                </div>
                <div style="margin-top: 2mm; font-family: 'Outfit', sans-serif; font-size: 7pt; color: rgba(255,255,255,0.5); letter-spacing: 1px; text-transform: uppercase;">Powered By Talent By Design</div>
            </div>
        </div>
    </div>
    </body>
</html>`;

        const getBulletedLines = (text, limit = 8) => {
            if (!text) return [];
            return text.split(/\r?\n/)
                .map(l => l.trim().replace(/^[•\-\*]\s*/, ''))
                .filter(l => l.length > 0)
                .slice(0, limit);
        };

        const parseStructuredOKRs = (text) => {
            if (!text || !text.trim()) return { focus: "", list: [] };

            let focus = "";
            let remainingText = text;

            // Extract [FOCUS] if present
            const focusMatch = text.match(/\[FOCUS\]\s*([\s\S]*?)(?:\r?\n\r?\n|\r?\n|$)/i);
            if (focusMatch) {
                focus = focusMatch[1].trim();
                remainingText = text.replace(focusMatch[0], "").trim();
            }

            // Split into blocks by double newlines
            const blocks = remainingText.split(/\r?\n\r?\n+/).map(b => b.trim()).filter(b => b.length > 0);

            const list = blocks.map(block => {
                const lines = block.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
                if (lines.length === 0) return null;

                let title = "";
                let keyResults = [];

                // Heuristic: if first line doesn't start with bullet, it's a title
                const firstLine = lines[0];
                const isBullet = /^[•\-\*]/.test(firstLine);

                if (!isBullet && lines.length > 1) {
                    title = firstLine;
                    keyResults = lines.slice(1).map(l => l.replace(/^[•\-\*]\s*/, ''));
                } else {
                    // All lines are key results
                    keyResults = lines.map(l => l.replace(/^[•\-\*]\s*/, ''));
                }

                return { title, keyResults };
            }).filter(item => item !== null);

            // Fallback for old simple list format if no blocks were parsed but text exists
            if (list.length === 0 && remainingText.trim()) {
                const lines = getBulletedLines(remainingText, 10);
                if (lines.length > 0) {
                    list.push({ title: "", keyResults: lines });
                }
            }

            return { focus, list };
        };

        const templateData = {
            colors: this.colors, userName, orgName, orgLogo, dateStr, isMasterReport, report, aiInsight,
            synergyIntro: this.synergyIntro
        };

        const roleKey = (report?.stakeholder || user?.role || "employee").toLowerCase();
        templateData.synergyRole = this.roleSynergyData[roleKey] || this.roleSynergyData["employee"];

        if (!isMasterReport) {
            const domainStructure = {
                "People Potential": ["Mindset & Adaptability", "Psychological Health & Safety", "Relational & Emotional Intelligence"],
                "Operational Steadiness": ["Prioritization", "Workflow Clarity", "Effective Resource Management"],
                "Digital Fluency": ["Data, AI & Automation Readiness", "Digital Communication & Collaboration", "Mindset, Confidence and Change Readiness", "Tool & System Proficiency"]
            };

            // POD-360 model data: keyed by role, then subdomain name, then classification
            const pod360RoleData = feedbackData[roleKey] || feedbackData['leader'] || feedbackData['admin'] || {};

            // Normalize subdomain name for lookup — handles minor naming variants
            // e.g. "Mindset, Confidence and Change Readiness" vs "Mindset, Confidence, and Change Readiness"
            const resolvePod360Key = (name) => {
                if (pod360RoleData[name]) return name;
                const normalise = s => s.toLowerCase().replace(/,\s*and\s+/g, ' and ').replace(/\s+/g, ' ').trim();
                return Object.keys(pod360RoleData).find(k => normalise(k) === normalise(name)) || null;
            };

            templateData.triangle = this._buildTriangleModelData(report);

            const resolvePriorityRole = (key) => {
                const normalized = (key || "employee").toLowerCase();
                if (normalized === "superadmin" || normalized === "super_admin") return "admin";
                if (feedbackData[normalized]) return normalized;
                return "leader";
            };

            templateData.topPriorities = computeTopPriorities({
                scores: report.scores,
                role: resolvePriorityRole(roleKey),
                limit: 3,
            }).map((p) => {
                const perf = (p.classification || "Low").toLowerCase();
                const urgency = perf === "low" ? "high" : perf === "medium" ? "medium" : "low";
                const urgencyLabel = urgency.charAt(0).toUpperCase() + urgency.slice(1);
                return {
                    ...p,
                    urgencyLabel,
                    cardClass: `priority-${urgency}`,
                    pillClass: `pill-${urgency}`,
                    scoreColorClass: urgency === "high" ? "score-urgent" : urgency === "medium" ? "score-medium" : "score-mild",
                    badgeClass: `badge-${urgency}`,
                };
            });
            templateData.prioritiesPageOne = templateData.topPriorities.slice(0, 2);
            templateData.prioritiesPageTwo = templateData.topPriorities.slice(2);
            templateData.hasPrioritiesContinued = templateData.prioritiesPageTwo.length > 0;

            templateData.dashboard = this._buildExecutiveDashboardData(
                report,
                templateData.topPriorities,
                aiInsight,
                comparisonData,
            );

            templateData.domainPages = ["People Potential", "Operational Steadiness", "Digital Fluency"].map(dName => {
                const dData = report.scores?.domains?.[dName];
                if (!dData) return null;
                const fb = dData.feedback || {};

                const subdomains = domainStructure[dName].map(sName => {
                    const subData = dData.subdomains?.[sName];
                    const subScore = typeof subData === 'object' ? subData.score : (subData || 60);
                    const subFb = dData.subdomainFeedback?.[sName] || {};

                    // Resolve the POD-360 model entry for this subdomain + classification
                    const classification = this._getClassification(subScore); // "Low" | "Medium" | "High"
                    const pod360Key = resolvePod360Key(sName);
                    const pod360 = (pod360Key ? pod360RoleData[pod360Key]?.[classification] : null) || {};

                    const fallback = {
                        insight: pod360.insight || "Consistency in this area varies across teams.",
                        okrs: [],
                        coaching: pod360.coachingTips ? getBulletedLines(pod360.coachingTips, 5) : [],
                        model: pod360.modelDescription || "The POD-360 model emphasizes consistent leadership application and data-driven feedback loops.",
                        programs: pod360.recommendedPrograms
                            ? getBulletedLines(pod360.recommendedPrograms, 4)
                            : ["Leadership Excellence Labs", "Executive Performance Toolkit"]
                    };

                    let rawInsight = subFb.insight || subFb.description || fallback.insight;
                    let rawModel = subFb.modelDescription || fallback.model;
                    let defaultOkrs = fallback.okrs;
                    let defaultCoaching = fallback.coaching;
                    let defaultPrograms = fallback.programs;

                    let subInsightArray = [];
                    if (Array.isArray(rawInsight)) {
                        subInsightArray = rawInsight;
                    } else if (typeof rawInsight === 'string') {
                        subInsightArray = rawInsight.split(/\n|(?=•)/);
                    }
                    let subInsightProcessed = subInsightArray.map(s => s.trim().replace(/^[•\-\*]\s*/, '')).filter(s => s.length > 0);

                    let subModelArray = [];
                    if (Array.isArray(rawModel)) {
                        subModelArray = rawModel;
                    } else if (typeof rawModel === 'string') {
                        subModelArray = rawModel.split(/\n|(?=•)/);
                    }
                    let modelDescriptionProcessed = subModelArray.map(s => s.trim().replace(/^[•\-\*]\s*/, '')).filter(s => s.length > 0);

                    return {
                        name: sName,
                        score: Math.round(subScore),
                        state: this._getClassification(subScore),
                        description: this.subdomainDescriptions[sName] || "",
                        icon: this.subdomainIcons[sName] || null,
                        modelDescription: subInsightProcessed, // Swapped: Insight data goes to Model section
                        insight: modelDescriptionProcessed,    // Swapped: Model data goes to Insight box
                        okrs: parseStructuredOKRs(subFb.objectives || ""),
                        coaching: getBulletedLines(subFb.coachingTips || "", 5).concat(defaultCoaching).slice(0, 5),
                        recommendedPrograms: getBulletedLines(subFb.recommendedPrograms || "", 4).concat(defaultPrograms).slice(0, 4)
                    };
                });

                const chunkedSubdomains = [];
                for (let i = 0; i < subdomains.length; i += 1) {
                    chunkedSubdomains.push(subdomains.slice(i, i + 1));
                }

                return {
                    name: dName,
                    score: Math.round(dData.score),
                    state: this._getClassification(dData.score),
                    description: this.domainDescriptions[dName] || "",
                    insights: getBulletedLines(fb.insight || fb.modelDescription || "", 5),
                    okrs: parseStructuredOKRs(fb.objectives || ""),
                    coaching: getBulletedLines(fb.coachingTips || "", 5),
                    subdomainPages: chunkedSubdomains,
                    aggregatedOKRs: subdomains.map(s => ({
                        subdomainName: s.name,
                        okrs: s.okrs
                    })).filter(s => s.okrs.list.length > 0 || s.okrs.focus)
                };
            }).filter(p => p !== null);
        }
        return handlebars.compile(templateSource)(templateData);
    }
}
export default new PDFReportService();
