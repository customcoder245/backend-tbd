import handlebars from 'handlebars';
import { PDFDocument, rgb } from 'pdf-lib';
import fs from 'fs';
import feedbackData from '../data/domainSubdomainFeedback.js';

const BRAND_LOGO_URL = "https://res.cloudinary.com/dfpkn8g8h/image/upload/v1774516563/logos/talent_by_design_logo_new.svg";

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

        this._browser = null;
        this._template = null;
    }

    _getClassification(score) {
        const s = Math.round(score || 0);
        if (s < 50) return "Low";
        if (s < 75) return "Medium";
        return "High";
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

            // Speed up: Intercept and skip unnecessary requests
            await page.setRequestInterception(true);
            page.on('request', (req) => {
                const type = req.resourceType();
                if (['image', 'font', 'stylesheet', 'document', 'script'].includes(type)) {
                    req.continue();
                } else {
                    req.abort();
                }
            });

            // Set timeouts
            page.setDefaultNavigationTimeout(30000);
            page.setDefaultTimeout(30000);

            console.log("[PDFService] Rendering content...");
            await page.setContent(html, {
                waitUntil: 'networkidle0'
            });

            console.log("[PDFService] Printing PDF...");
            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: { top: '15mm', right: '0mm', bottom: '12mm', left: '0mm' },
                displayHeaderFooter: true,
                headerTemplate: `
                    <div style="font-family: 'Segoe UI', Tahoma, sans-serif; font-size: 7.5pt; width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 0 15mm; color: #64748B; font-weight: 500; text-transform: uppercase; letter-spacing: 1px; -webkit-print-color-adjust: exact;">
                        <div style="display: flex; align-items: center; gap: 1.5mm;">
                            <span style="color: #448CD2; font-weight: 800;">POD-360™</span>
                            <span style="opacity: 0.3;">|</span>
                            <span>Intelligence Report</span>
                        </div>
                        <div style="color: #1A3652; font-weight: 700; letter-spacing: 0.5px;">${userName}</div>
                    </div>
                `,
                footerTemplate: `
                    <div style="font-family: 'Segoe UI', Tahoma, sans-serif; font-size: 7.5pt; width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 0 15mm; color: #94A3B8; -webkit-print-color-adjust: exact;">
                        <div style="font-weight: 400;">Confidential © Talent By Design</div>
                        <div style="font-weight: 600; color: #64748B;">PAGE <span class="pageNumber"></span> / <span class="totalPages"></span></div>
                    </div>
                `,
                timeout: 30000
            });

            // Use pdf-lib to mask header/footer on page 1
            try {
                console.log("[PDFService] Masking header/footer on Page 1...");
                const pdfDoc = await PDFDocument.load(pdfBuffer);
                const pages = pdfDoc.getPages();
                if (pages.length > 0) {
                    const firstPage = pages[0];
                    const { width, height } = firstPage.getSize();

                    // Mask Header (Top 25mm + 1mm overlap)
                    const maskHeight = 26 * 2.835;
                    firstPage.drawRectangle({
                        x: 0,
                        y: height - maskHeight,
                        width: width,
                        height: maskHeight,
                        color: rgb(26/255, 54/255, 82/255), // Navy
                    });

                    // Mask Footer (Bottom 20mm + 1mm overlap)
                    const footerMaskHeight = 21 * 2.835;
                    firstPage.drawRectangle({
                        x: 0,
                        y: 0,
                        width: width,
                        height: footerMaskHeight,
                        color: rgb(26/255, 54/255, 82/255), // Navy
                    });
                }
                const modifiedPdfBuffer = await pdfDoc.save();
                return Buffer.from(modifiedPdfBuffer);
            } catch (maskError) {
                console.error("[PDFService] Masking failed, returning original PDF:", maskError);
                return pdfBuffer;
            }
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
        const userName = isMasterReport 
            ? `${orgName} Intelligence Report`
            : (`${user?.firstName || ""} ${user?.lastName || ""}`.trim() || user?.email || "Participant");
        const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

        const templateSource = `
<!DOCTYPE html>
<html>
<head>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@400;600;700;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #1A3652;
            --secondary: #448CD2;
            --sidebar: #EDF5FD;
            --friction: #FF5656;
            --flow: #30AD43;
            --resistance: #FEE114;
            --text: #334155;
            --light-text: #64748B;
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
            font-family: 'Inter', sans-serif; 
            color: var(--text); 
        }

        .page { 
            width: 210mm; 
            min-height: 270mm; 
            padding: 0mm 15mm; 
            position: relative; 
            display: flex; 
            flex-direction: column; 
            background: #ffffff; 
            page-break-after: always; 
            break-after: page;
            overflow: hidden;
            box-sizing: border-box;
        }
        .page-flow {
            min-height: 297mm;
            height: auto !important;
            overflow: visible !important;
        }
        .page:last-of-type { page-break-after: auto; break-after: auto; }

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
            height: 270mm;
            min-height: 270mm !important;
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

        .cover-accent-bottom {
            position: absolute;
            bottom: -100px;
            left: -100px;
            width: 300px;
            height: 300px;
            background: white;
            opacity: 0.05;
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
            font-family: 'Outfit', sans-serif;
            font-size: 64pt;
            font-weight: 900;
            line-height: 0.85;
            letter-spacing: -3px;
            margin-bottom: 5mm;
            text-transform: uppercase;
        }

        .cover-subtitle {
            font-family: 'Inter', sans-serif;
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
            bottom: 15mm;
            left: 20mm;
            right: 20mm;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10mm;
            border-top: 1px solid rgba(255,255,255,0.1);
            padding-top: 8mm;
            z-index: 10;
        }

        .footer-item {
            display: flex;
            flex-direction: column;
            gap: 1mm;
        }

        .footer-label {
            font-family: 'Outfit', sans-serif;
            font-size: 7.5pt;
            font-weight: 700;
            color: rgba(255,255,255,0.5);
            text-transform: uppercase;
            letter-spacing: 1.5px;
        }

        .footer-value {
            font-family: 'Inter', sans-serif;
            font-size: 10.5pt;
            font-weight: 600;
            color: white;
        }

        /* Typography */
        /* Typography - Compact & Perfect */
        h1 { font-family: 'Outfit', sans-serif; font-size: 22pt; font-weight: 800; color: var(--primary); margin: 0 0 4mm 0; letter-spacing: -0.8px; line-height: 1.1; }
        h2 { font-family: 'Outfit', sans-serif; font-size: 15pt; font-weight: 700; color: var(--primary); margin: 6mm 0 3mm 0; letter-spacing: -0.4px; }
        p { font-size: 10pt; color: var(--text); margin-bottom: 3mm; line-height: 1.5; font-weight: 400; }

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
            font-family: 'Outfit', sans-serif;
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
            gap: 15mm; 
            margin-bottom: 8mm; 
            background: var(--white); 
            padding: 8mm 10mm; 
            border-radius: 5mm; 
            box-shadow: 0 15px 40px rgba(0,0,0,0.04); 
            border: 1px solid #f1f5f9; 
        }
        .visual-container { position: relative; width: 220px; height: 130px; flex-shrink: 0; }
        .gauge-val { position: absolute; top: 65%; left: 50%; transform: translate(-50%, -50%); font-size: 38pt; font-weight: 900; color: var(--primary); letter-spacing: -2px; font-family: 'Outfit', sans-serif; }
        .gauge-label { position: absolute; top: 95%; left: 50%; transform: translate(-50%, -50%); font-size: 9pt; font-weight: 700; color: var(--secondary); text-transform: uppercase; letter-spacing: 2px; }

        /* Domain Header - Side-by-Side Flex */
        .domain-flex-header {
            display: flex;
            gap: 4mm;
            margin-bottom: 6mm;
            align-items: stretch;
        }
        .domain-header-box { 
            flex: 1.6;
            background: var(--primary-gradient); 
            color: white; 
            padding: 6mm 8mm; 
            border-radius: 4mm; 
            margin-bottom: 0; 
            position: relative; 
            overflow: hidden; 
            box-shadow: 0 10px 25px rgba(26, 54, 82, 0.2); 
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
        .domain-header-box h1 { color: white; margin: 0; font-size: 20pt; line-height: 1.1; }
        .domain-desc { 
            font-size: 9pt; 
            color: rgba(255,255,255,0.9); 
            margin-top: 3mm; 
            line-height: 1.4; 
            font-weight: 300; 
        }
        .score-summary-box { 
            flex: 1;
            display: flex; 
            flex-direction: column;
            justify-content: center;
            align-items: center; 
            color: white; 
            padding: 4mm 6mm; 
            border-radius: 4mm; 
            margin-bottom: 0; 
            box-shadow: 0 8px 20px rgba(0,0,0,0.1); 
            position: relative;
            overflow: hidden;
            text-align: center;
        }
        .score-label { font-family: 'Outfit', sans-serif; font-size: 8pt; font-weight: 600; text-transform: uppercase; opacity: 0.9; letter-spacing: 1.5px; }
        .score-value-large { font-family: 'Outfit', sans-serif; font-size: 22pt; font-weight: 800; letter-spacing: -1px; }

        /* Tables - Compact */
        .table-container { margin: 6mm 0; border-radius: 3mm; overflow: hidden; border: 1px solid #f1f5f9; }
        .table { width: 100%; border-collapse: collapse; }
        .table th { background: #f8fafc; text-align: left; padding: 4mm 5mm; font-size: 8pt; font-weight: 700; color: var(--light-text); text-transform: uppercase; letter-spacing: 1.2px; border-bottom: 2px solid #e2e8f0; }
        .table td { padding: 4mm 5mm; border-bottom: 1px solid #f1f5f9; font-size: 9.5pt; color: var(--text); }
        .table tr:last-child td { border-bottom: none; }

        /* Status Badges */
        .badge { 
            display: inline-flex; 
            align-items: center; 
            padding: 1.2mm 3.5mm; 
            border-radius: 50px; 
            font-size: 7.5pt; 
            font-weight: 700; 
            text-transform: uppercase; 
            letter-spacing: 0.8px; 
            font-family: 'Outfit', sans-serif;
        }
        .badge-high { background: #dcfce7; color: #166534; }
        .badge-medium { background: #fef9c3; color: #854d0e; }
        .badge-low { background: #fee2e2; color: #991b1b; }

        /* Bullet Lists - Compact */
        .bullet-list { list-style: none; padding: 0; margin: 0; }
        .bullet-item { display: flex; margin-bottom: 1.5mm; font-size: 10pt; align-items: flex-start; color: var(--text); line-height: 1.35; }
        .bullet-dot { width: 5px; height: 5px; background: var(--secondary); border-radius: 50%; margin-right: 4mm; margin-top: 1.8mm; flex-shrink: 0; }

        .subdomain-analysis-card {
            background: transparent;
            border: none;
            border-radius: 0;
            padding: 0;
            margin-bottom: 6mm;
            box-shadow: none;
        }
        .subdomain-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 6mm;
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
            font-family: 'Outfit', sans-serif;
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
        .sub-metric-title::before {
            content: '';
            width: 3px;
            height: 12px;
            background: var(--secondary);
            border-radius: 2px;
        }

        .highlight-box {
            background: #eff6ff;
            border-radius: 3mm;
            padding: 5mm 6mm;
            margin-top: 8mm;
            border-left: 4px solid var(--secondary);
        }
    </style>
</head>
<body>
    <!-- COVER PAGE -->
    <div class="page cover-page">
        <div class="cover-accent-top"></div>
        <div class="cover-accent-bottom"></div>
        
        <div class="cover-logo-container">
            <img src="${BRAND_LOGO_URL}" class="logo-large" />
        </div>

        <div class="cover-title-group">
            <div class="cover-main-title">POD-360™</div>
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
    <!-- SUMMARY PAGE -->
    <div class="page">

        
        <h1>The Data Synergy</h1>
        
            <div style="margin-bottom: 8mm; border-left: 5px solid var(--secondary); padding-left: 8mm; background: #f8fafc; padding-block: 6mm; border-radius: 0 4mm 4mm 0; box-shadow: 0 8px 25px rgba(0,0,0,0.02);">
            <p style="font-size: 11pt; color: var(--primary); font-weight: 500; margin-bottom: 4mm; line-height: 1.5;">{{synergyIntro}}</p>
            <div style="display: flex; flex-direction: column; gap: 3mm;">
                <div style="display: flex; align-items: center; gap: 3mm;">
                    <span style="font-family: 'Outfit', sans-serif; font-weight: 800; color: var(--secondary); font-size: 8pt; text-transform: uppercase; letter-spacing: 2px;">Assessed Role: {{synergyRole.name}}</span>
                </div>
                <p style="color: var(--light-text); font-size: 9.5pt; margin: 0; line-height: 1.5;">{{synergyRole.description}}</p>
            </div>
        </div>

        <div class="summary-hero">
            <div class="visual-container">
                <svg width="220" height="130" viewBox="0 0 200 110">
                    <defs>
                        <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" style="stop-color:{{gaugeColor report.scores.overall}};stop-opacity:0.7" />
                            <stop offset="100%" style="stop-color:{{gaugeColor report.scores.overall}};stop-opacity:1" />
                        </linearGradient>
                        <filter id="shadow">
                            <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.1" />
                        </filter>
                    </defs>
                    <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#f1f5f9" stroke-width="18" stroke-linecap="round" />
                    <path d="M 20 100 A 80 80 0 0 1 {{gaugePath 80 report.scores.overall}}" fill="none" stroke="url(#gaugeGradient)" stroke-width="18" stroke-linecap="round" filter="url(#shadow)" />
                    <circle cx="{{gaugePathX 80 report.scores.overall}}" cy="{{gaugePathY 80 report.scores.overall}}" r="7" fill="white" stroke="{{gaugeColor report.scores.overall}}" stroke-width="4" />
                </svg>
                <div class="gauge-val">{{round report.scores.overall}}%</div>
                <div class="gauge-label">{{getClassification report.scores.overall}}</div>
            </div>
            <div style="flex: 1;">
                <h3 style="font-family: 'Outfit', sans-serif; font-size: 14pt; font-weight: 700; color: var(--primary); margin: 0 0 3mm 0; letter-spacing: -0.5px;">Portfolio Score</h3>
                <p style="font-size: 10pt; margin-bottom: 0; line-height: 1.5;">Your consolidated performance score is <strong style="color: var(--secondary); font-size: 12pt; font-family: 'Outfit', sans-serif;">{{round report.scores.overall}}%</strong>. This indicates a state of <strong style="color: {{gaugeColor report.scores.overall}};">{{getClassification report.scores.overall}} Efficiency</strong> across your organizational footprint.</p>
            </div>
        </div>

        <div class="card card-insight">
            <div class="block-title">Key Strategic Intelligence</div>
            <p style="font-size: 11pt; font-weight: 600; color: var(--primary); line-height: 1.5; margin: 0; letter-spacing: -0.2px;">{{aiInsight.description}}</p>
        </div>

        <h2 style="margin-top: 10mm;">Domain Analysis Matrix</h2>
        <div class="table-container">
            <table class="table">
                <thead>
                    <tr>
                        <th>Strategic Domain</th>
                        <th>Efficiency</th>
                        <th>Current State</th>
                    </tr>
                </thead>
                <tbody>
                    {{#each domainPages}}
                    <tr>
                        <td style="font-weight: 700; color: var(--primary); font-size: 11pt;">{{name}}</td>
                        <td style="font-weight: 800; color: var(--secondary); font-size: 12pt; font-family: 'Outfit', sans-serif;">{{round score}}%</td>
                        <td><span class="badge badge-{{toLowerCase (getClassification score)}}">{{getClassification score}}</span></td>
                    </tr>
                    {{/each}}
                </tbody>
            </table>
        </div>

        <!-- POD-360 MODEL TRIANGLE (Summary Page Only) -->
        <div style="background: #EDF5FD; border-left: 5px solid var(--secondary); border-radius: 4mm; padding: 5mm 8mm; margin-top: 6mm; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
            <div style="font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 8.5pt; color: var(--primary); text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 3mm;">POD-360&#8482; Model Performance Intelligence</div>
                <svg width="220" height="210" viewBox="0 0 300 290" style="display: block; margin: 0 auto; -webkit-print-color-adjust: exact;">
                    <!-- Background triangle: T(150,35) L(30,243) R(270,243) -->
                    <polygon points="150,35 30,243 270,243" fill="#dceaf7" stroke="#aecde8" stroke-width="1.5"/>
                    <!-- People Potential zone (top, dark navy) -->
                    <polygon points="{{@root.triangleSVG.pp}}" fill="#1A3652" opacity="0.88"/>
                    <!-- Operational Steadiness zone (bottom-left, mid blue) -->
                    <polygon points="{{@root.triangleSVG.os}}" fill="#2563a8" opacity="0.78"/>
                    <!-- Digital Fluency zone (bottom-right, light blue) -->
                    <polygon points="{{@root.triangleSVG.df}}" fill="#448CD2" opacity="0.62"/>
                    
                    <!-- Labels and Scores -->
                    <!-- TOP: People Potential -->
                    <text x="150" y="8" text-anchor="middle" font-family="Arial, sans-serif" font-size="8.5" font-weight="700" fill="#1A3652">PEOPLE</text>
                    <text x="150" y="19" text-anchor="middle" font-family="Arial, sans-serif" font-size="8.5" font-weight="700" fill="#1A3652">POTENTIAL</text>
                    <text x="150" y="32" text-anchor="middle" font-family="'Outfit', sans-serif" font-size="11" font-weight="800" fill="#1A3652">{{@root.triangleSVG.ppScore}}%</text>

                    <!-- BOTTOM LEFT: Operational Steadiness -->
                    <text x="35" y="254" text-anchor="middle" font-family="Arial, sans-serif" font-size="8.5" font-weight="700" fill="#1A3652">OPERATIONAL</text>
                    <text x="35" y="265" text-anchor="middle" font-family="Arial, sans-serif" font-size="8.5" font-weight="700" fill="#1A3652">STEADINESS</text>
                    <text x="35" y="280" text-anchor="middle" font-family="'Outfit', sans-serif" font-size="11" font-weight="800" fill="#2563a8">{{@root.triangleSVG.osScore}}%</text>

                    <!-- BOTTOM RIGHT: Digital Fluency -->
                    <text x="265" y="254" text-anchor="middle" font-family="Arial, sans-serif" font-size="8.5" font-weight="700" fill="#1A3652">DIGITAL</text>
                    <text x="265" y="265" text-anchor="middle" font-family="Arial, sans-serif" font-size="8.5" font-weight="700" fill="#1A3652">FLUENCY</text>
                    <text x="265" y="280" text-anchor="middle" font-family="'Outfit', sans-serif" font-size="11" font-weight="800" fill="#448CD2">{{@root.triangleSVG.dfScore}}%</text>
                </svg>
        </div>


    </div>

    {{#each domainPages}}
    <!-- DOMAIN ANALYSIS PAGE -->
    <div class="page page-flow" style="display: block;">

        <div class="domain-flex-header">
            <div class="domain-header-box">
                <h1>{{name}}</h1>
                <div class="domain-desc">{{description}}</div>
            </div>

            <div class="score-summary-box" style="background: {{gaugeColor score}};">
                <div class="score-label">Domain Efficiency</div>
                <div class="score-value-large">{{round score}}%</div>
                <div class="badge badge-{{toLowerCase (getClassification score)}}" style="margin-top: 1.5mm; background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.3);">{{getClassification score}}</div>
            </div>
        </div>



        <!-- SUBDOMAINS -->
        {{#each subdomainPages}}
        {{#each this}}
        <div class="subdomain-analysis-card">
            <div class="subdomain-header">
                <div>
                    <div style="font-family: 'Outfit', sans-serif; font-size: 8pt; color: var(--secondary); font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 2mm;">Sub-Domain Focus</div>
                    <h2 style="margin: 0; font-size: 22pt; border: none; padding: 0;">{{name}}</h2>
                </div>
                <div style="text-align: right;">
                    <div style="font-family: 'Outfit', sans-serif; font-size: 26pt; font-weight: 800; color: var(--secondary); line-height: 1;">{{round score}}%</div>
                    <div class="badge badge-{{toLowerCase state}}" style="margin-top: 2mm;">{{state}}</div>
                </div>
            </div>

            <p style="font-size: 10pt; line-height: 1.5; color: var(--text); margin-bottom: 4mm;">{{description}}</p>

            <!-- POD-360 INSIGHT (per subdomain) -->
            {{#if modelDescription}}
            <div style="background: #EDF5FD; border-left: 5px solid var(--secondary); border-radius: 4mm; padding: 6mm 8mm; margin-bottom: 10mm; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
                <div style="font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 9pt; color: var(--primary); text-transform: uppercase; letter-spacing: 2px; margin-bottom: 4mm;">POD-360&#8482; Model</div>
                <div style="display: flex; align-items: flex-start; gap: 3mm;">
                    <span style="color: #448CD2; font-size: 11pt; flex-shrink: 0; margin-top: 1px;">&#9733;</span>
                    <div>
                        {{#each modelDescription}}
                        <div style="font-size: 10pt; line-height: 1.65; color: #334155;">{{this}}</div>
                        {{/each}}
                    </div>
                </div>
            </div>
            {{/if}}

            <div class="card-insight-box" style="background: #f1f5f9; padding: 5mm 7mm; border-radius: 4mm; border-left: 5px solid var(--primary); margin-bottom: 6mm;">
                <div class="block-title" style="margin-bottom: 2mm; color: var(--primary);">Contextual Insight</div>
                {{#each insight}}
                <div style="font-size: 9.5pt; line-height: 1.4; color: var(--text); margin-bottom: 1.5mm;">{{this}}</div>
                {{/each}}
            </div>

            <div class="sub-metrics-grid">
                <div class="sub-metric-box" style="border-top: 4px solid var(--secondary); background: #ffffff;">
                    <div class="sub-metric-title">Priority Actions (OKRs)</div>
                    {{#if okrs.focus}}
                    <div style="font-size: 8.5pt; font-weight: 700; color: var(--secondary); margin-bottom: 3mm; padding: 1.5mm 2.5mm; background: #f0f7ff; border-radius: 1.5mm; border-left: 3px solid var(--secondary);">
                        <span style="opacity: 0.7; text-transform: uppercase; font-size: 7pt; letter-spacing: 0.5px; display: block; margin-bottom: 0.5mm;">Focus Area</span>
                        {{okrs.focus}}
                    </div>
                    {{/if}}
                    
                    {{#each okrs.list}}
                    <div style="margin-bottom: 4mm;">
                        {{#if title}}
                        <div style="font-weight: 700; font-size: 9pt; color: var(--primary); margin-bottom: 2mm; display: flex; align-items: center; gap: 2mm;">
                            <div style="width: 8px; height: 2px; background: var(--secondary); border-radius: 1px;"></div>
                            {{title}}
                        </div>
                        {{/if}}
                        <ul class="bullet-list" style="margin-left: 2mm;">
                            {{#each keyResults}}
                            <li class="bullet-item">
                                <div class="bullet-dot"></div>
                                {{this}}
                            </li>
                            {{/each}}
                        </ul>
                    </div>
                    {{/each}}
                    
                    {{#unless okrs.list.length}}
                    <p style="font-size: 9pt; color: var(--light-text); font-style: italic;">No specific objectives defined for this period.</p>
                    {{/unless}}
                </div>
                <div class="sub-metric-box" style="border-top: 4px solid var(--primary);">
                    <div class="sub-metric-title">Coaching & Development</div>
                    <ul class="bullet-list">
                        {{#each coaching}}
                        <li class="bullet-item">
                            <div class="bullet-dot" style="background: var(--primary);"></div>
                            {{this}}
                        </li>
                        {{/each}}
                    </ul>
                </div>
            </div>

            {{#if recommendedPrograms.length}}
            <div class="highlight-box">
                <div class="block-title" style="margin-bottom: 4mm;">RECOMMENDED PROGRAMS AND INITIATIVES</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4mm;">
                    {{#each recommendedPrograms}}
                    <div style="display: flex; align-items: center; gap: 3mm; font-size: 10pt; font-weight: 600; color: var(--primary);">
                        <div style="width: 5px; height: 5px; background: var(--secondary); border-radius: 50%;"></div>
                        {{this}}
                    </div>
                    {{/each}}
                </div>
            </div>
            {{/if}}
        </div>
        {{/each}}
        {{/each}}


    </div>
    {{/each}}
    {{/unless}}
</body>
</html>
`;

        // Register Helpers
        if (!this._template) {
            // Register Helpers (only once)
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
                multiply: (a, b) => (a || 0) * (b || 0)
            };

            Object.keys(helpers).forEach(name => {
                if (!handlebars.helpers[name]) {
                    handlebars.registerHelper(name, helpers[name]);
                }
            });

            this._template = handlebars.compile(templateSource);
        }

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
            colors: this.colors, userName, orgName, dateStr, isMasterReport, report, aiInsight,
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

            // Precompute triangle SVG polygon points for the POD-360 Model visualization
            const ppScore = Math.round(report.scores?.domains?.["People Potential"]?.score || 0);
            const osScore = Math.round(report.scores?.domains?.["Operational Steadiness"]?.score || 0);
            const dfScore = Math.round(report.scores?.domains?.["Digital Fluency"]?.score || 0);

            const ppFrac = Math.min(1, ppScore / 100);
            const osFrac = Math.min(1, osScore / 100);
            const dfFrac = Math.min(1, dfScore / 100);

            templateData.triangleSVG = {
                ppScore, osScore, dfScore,
                // Perfect equilateral triangle: T=(150,35) L=(30,243) R=(270,243), C=(150,173.67)
                // ML=(90,139)  MR=(210,139)  MB=(150,243)
                pp: `150,173.67 ${(150-60*ppFrac).toFixed(2)},${(173.67-34.67*ppFrac).toFixed(2)} 150,${(173.67-138.67*ppFrac).toFixed(2)} ${(150+60*ppFrac).toFixed(2)},${(173.67-34.67*ppFrac).toFixed(2)}`,
                os: `150,173.67 ${(150-60*osFrac).toFixed(2)},${(173.67-34.67*osFrac).toFixed(2)} ${(150-120*osFrac).toFixed(2)},${(173.67+69.33*osFrac).toFixed(2)} 150,${(173.67+69.33*osFrac).toFixed(2)}`,
                df: `150,173.67 ${(150+60*dfFrac).toFixed(2)},${(173.67-34.67*dfFrac).toFixed(2)} ${(150+120*dfFrac).toFixed(2)},${(173.67+69.33*dfFrac).toFixed(2)} 150,${(173.67+69.33*dfFrac).toFixed(2)}`
            };

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
                    subdomainPages: chunkedSubdomains
                };
            }).filter(p => p !== null);
        }
        return this._template(templateData);
    }
}
export default new PDFReportService();
