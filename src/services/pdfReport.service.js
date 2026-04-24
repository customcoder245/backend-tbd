import handlebars from 'handlebars';
import { PDFDocument, rgb } from 'pdf-lib';
import fs from 'fs';

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
                margin: { top: '25mm', right: '0mm', bottom: '20mm', left: '0mm' },
                displayHeaderFooter: true,
                headerTemplate: `
                    <div style="font-family: 'Helvetica', 'Arial', sans-serif; font-size: 8pt; width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 0 20mm; color: #448CD2; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; -webkit-print-color-adjust: exact;">
                        <div style="flex: 1;">POD-360™ Performance Intelligence</div>
                        <div style="flex: 1; text-align: right;">
                            <span style="color: #1A3652; font-weight: 900; letter-spacing: 2px;">TALENT BY DESIGN</span>
                        </div>
                    </div>
                `,
                footerTemplate: `
                    <div style="font-family: 'Helvetica', 'Arial', sans-serif; font-size: 8pt; width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 0 20mm; color: #64748B; border-top: 1px solid #f1f5f9; padding-top: 4mm; -webkit-print-color-adjust: exact;">
                        <div style="flex: 1;">Confidential • Talent By Design</div>
                        <div style="flex: 1; text-align: right;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>
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

                    // Mask Header (Top 25mm)
                    // 1mm approx 2.83 points
                    const maskHeight = 25 * 2.83;
                    firstPage.drawRectangle({
                        x: 0,
                        y: height - maskHeight,
                        width: width,
                        height: maskHeight,
                        color: rgb(1, 1, 1), // White
                    });

                    // Mask Footer (Bottom 20mm)
                    const footerMaskHeight = 20 * 2.83;
                    firstPage.drawRectangle({
                        x: 0,
                        y: 0,
                        width: width,
                        height: footerMaskHeight,
                        color: rgb(1, 1, 1), // White
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
        const userName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || user?.email || "Participant";
        const orgName = isMasterReport ? data.orgName : (user?.orgName || "Talent By Design");
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
        body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; font-family: 'Inter', sans-serif; color: var(--text); background: #fcfcfc; }

        .page { 
            width: 210mm; 
            min-height: 297mm; 
            padding: 0mm 20mm; 
            position: relative; 
            display: flex; 
            flex-direction: column; 
            background: var(--white); 
            page-break-after: always; 
            break-after: page;
            overflow: hidden;
        }
        .page-flow {
            min-height: 297mm;
            height: auto !important;
            overflow: visible !important;
        }
        .page:last-of-type { page-break-after: auto; break-after: auto; }



        /* Cover Page */
        .cover-page { 
            padding: 0; 
            display: flex; 
            flex-direction: column; 
            background: #ffffff;
            justify-content: space-between;
            overflow: hidden;
            position: relative;
        }
        
        .cover-bg-accent {
            position: absolute;
            top: -100px;
            right: -100px;
            width: 500px;
            height: 500px;
            background: radial-gradient(circle, rgba(68, 140, 210, 0.08) 0%, rgba(26, 54, 82, 0) 70%);
            border-radius: 50%;
            z-index: 0;
        }

        .cover-bg-bottom {
            position: absolute;
            bottom: -150px;
            left: -150px;
            width: 600px;
            height: 600px;
            background: radial-gradient(circle, rgba(26, 54, 82, 0.05) 0%, rgba(68, 140, 210, 0) 70%);
            border-radius: 50%;
            z-index: 0;
        }

        .cover-top-line {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 6px;
            background: var(--primary-gradient);
            z-index: 10;
        }

        .cover-content {
            position: relative;
            z-index: 1;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 40mm 25mm 25mm 25mm;
        }

        .cover-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .brand-logo-main {
            width: 55mm;
        }

        .brand-tagline {
            font-family: 'Outfit', sans-serif;
            font-size: 9pt;
            font-weight: 700;
            color: var(--secondary);
            letter-spacing: 4px;
            text-transform: uppercase;
        }

        .cover-body {
            margin-top: 20mm;
        }

        .report-label {
            font-family: 'Outfit', sans-serif;
            font-size: 11pt;
            font-weight: 700;
            color: var(--secondary);
            letter-spacing: 2px;
            text-transform: uppercase;
            margin-bottom: 5mm;
        }

        .main-title {
            font-family: 'Outfit', sans-serif;
            font-size: 58pt;
            font-weight: 900;
            color: var(--primary);
            line-height: 0.9;
            letter-spacing: -2.5px;
            margin-bottom: 8mm;
        }

        .main-subtitle {
            font-family: 'Inter', sans-serif;
            font-size: 22pt;
            font-weight: 300;
            color: var(--light-text);
            max-width: 80%;
            line-height: 1.3;
        }

        .main-subtitle strong {
            font-weight: 700;
            color: var(--primary);
        }

        .cover-footer {
            border-top: 1.5px solid #f1f5f9;
            padding-top: 15mm;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10mm;
        }

        .footer-item {
            display: flex;
            flex-direction: column;
            gap: 2mm;
        }

        .footer-label {
            font-family: 'Outfit', sans-serif;
            font-size: 8pt;
            font-weight: 700;
            color: var(--light-text);
            text-transform: uppercase;
            letter-spacing: 1.5px;
        }

        .footer-value {
            font-family: 'Inter', sans-serif;
            font-size: 11pt;
            font-weight: 600;
            color: var(--primary);
        }

        /* Typography */
        h1 { font-family: 'Outfit', sans-serif; font-size: 26pt; font-weight: 800; color: var(--primary); margin: 0 0 8mm 0; letter-spacing: -1px; }
        h2 { font-family: 'Outfit', sans-serif; font-size: 18pt; font-weight: 700; color: var(--primary); margin: 12mm 0 6mm 0; letter-spacing: -0.5px; }
        p { font-size: 10.5pt; color: var(--text); margin-bottom: 5mm; line-height: 1.7; font-weight: 400; }

        /* Inner Cards */
        .card { 
            background: #f8fafc; 
            padding: 8mm; 
            border-radius: 4mm; 
            margin-bottom: 8mm; 
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
            margin-bottom: 12mm; 
            background: var(--white); 
            padding: 10mm; 
            border-radius: 5mm; 
            box-shadow: 0 15px 40px rgba(0,0,0,0.04); 
            border: 1px solid #f1f5f9; 
        }
        .visual-container { position: relative; width: 220px; height: 130px; flex-shrink: 0; }
        .gauge-val { position: absolute; top: 65%; left: 50%; transform: translate(-50%, -50%); font-size: 38pt; font-weight: 900; color: var(--primary); letter-spacing: -2px; font-family: 'Outfit', sans-serif; }
        .gauge-label { position: absolute; top: 95%; left: 50%; transform: translate(-50%, -50%); font-size: 9pt; font-weight: 700; color: var(--secondary); text-transform: uppercase; letter-spacing: 2px; }

        /* Domain Header */
        .domain-header-box { 
            background: var(--primary-gradient); 
            color: white; 
            padding: 15mm; 
            border-radius: 5mm; 
            margin-bottom: 10mm; 
            position: relative; 
            overflow: hidden; 
            box-shadow: 0 15px 35px rgba(26, 54, 82, 0.2); 
        }
        .domain-header-box::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -20%;
            width: 300px;
            height: 300px;
            background: rgba(255,255,255,0.05);
            border-radius: 50%;
        }
        .domain-desc { 
            font-size: 11pt; 
            color: rgba(255,255,255,0.9); 
            margin-top: 5mm; 
            line-height: 1.7; 
            font-weight: 300; 
            max-width: 85%; 
        }
        .domain-header-box h1 { color: white; margin: 0; font-size: 32pt; }

        /* Tables */
        .table-container { margin: 8mm 0; border-radius: 4mm; overflow: hidden; border: 1px solid #f1f5f9; }
        .table { width: 100%; border-collapse: collapse; }
        .table th { background: #f8fafc; text-align: left; padding: 5mm 6mm; font-size: 8.5pt; font-weight: 700; color: var(--light-text); text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 2px solid #e2e8f0; }
        .table td { padding: 5mm 6mm; border-bottom: 1px solid #f1f5f9; font-size: 10.5pt; color: var(--text); }
        .table tr:last-child td { border-bottom: none; }

        /* Status Badges */
        .badge { 
            display: inline-flex; 
            align-items: center; 
            padding: 1.5mm 4mm; 
            border-radius: 50px; 
            font-size: 8pt; 
            font-weight: 700; 
            text-transform: uppercase; 
            letter-spacing: 1px; 
            font-family: 'Outfit', sans-serif;
        }
        .badge-high { background: #dcfce7; color: #166534; }
        .badge-medium { background: #fef9c3; color: #854d0e; }
        .badge-low { background: #fee2e2; color: #991b1b; }

        /* Bullet Lists */
        .bullet-list { list-style: none; padding: 0; margin: 0; }
        .bullet-item { display: flex; margin-bottom: 3.5mm; font-size: 10pt; align-items: flex-start; color: var(--text); line-height: 1.6; }
        .bullet-dot { width: 6px; height: 6px; background: var(--secondary); border-radius: 50%; margin-right: 5mm; margin-top: 2.5mm; flex-shrink: 0; }
        
        .score-summary-box { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            color: white; 
            padding: 8mm 12mm; 
            border-radius: 4mm; 
            margin-bottom: 10mm; 
            box-shadow: 0 10px 25px rgba(0,0,0,0.1); 
            position: relative;
            overflow: hidden;
        }
        .score-label { font-family: 'Outfit', sans-serif; font-size: 9pt; font-weight: 600; text-transform: uppercase; opacity: 0.9; letter-spacing: 1.5px; }
        .score-value-large { font-family: 'Outfit', sans-serif; font-size: 28pt; font-weight: 800; letter-spacing: -1px; }

        .subdomain-analysis-card {
            background: transparent;
            border: none;
            border-radius: 0;
            padding: 0;
            margin-bottom: 15mm;
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
            padding: 7mm;
            border-radius: 4mm;
            border: 1px solid #e2e8f0;
        }
        .sub-metric-title { 
            font-family: 'Outfit', sans-serif;
            font-size: 9pt; 
            font-weight: 700; 
            color: var(--primary); 
            text-transform: uppercase; 
            margin-bottom: 5mm; 
            letter-spacing: 1.5px; 
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
        <div class="cover-bg-accent"></div>
        <div class="cover-bg-bottom"></div>
        <div class="cover-top-line"></div>
        
        <div class="cover-content">
            <div class="cover-header">
                <img src="${BRAND_LOGO_URL}" class="brand-logo-main" />
                <div class="brand-tagline">Performance Intelligence</div>
            </div>

            <div class="cover-body">
                <div class="report-label">Strategic Organizational Review</div>
                <div class="main-title">POD-360™</div>
                <div class="main-subtitle">
                    Transforming data into <strong>Executive Clarity</strong> and sustainable performance.
                </div>
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
    </div>

    {{#unless isMasterReport}}
    <!-- SUMMARY PAGE -->
    <div class="page">

        
        <h1>The Data Synergy</h1>
        
        <div style="margin-bottom: 12mm; border-left: 5px solid var(--secondary); padding-left: 10mm; background: #f8fafc; padding-block: 8mm; border-radius: 0 5mm 5mm 0; box-shadow: 0 10px 30px rgba(0,0,0,0.02);">
            <p style="font-size: 12pt; color: var(--primary); font-weight: 500; margin-bottom: 6mm; line-height: 1.6;">{{synergyIntro}}</p>
            <div style="display: flex; flex-direction: column; gap: 4mm;">
                <div style="display: flex; align-items: center; gap: 3mm;">
                    <span style="font-family: 'Outfit', sans-serif; font-weight: 800; color: var(--secondary); font-size: 8.5pt; text-transform: uppercase; letter-spacing: 2px;">Assessed Role: {{synergyRole.name}}</span>
                </div>
                <p style="color: var(--light-text); font-size: 10.5pt; margin: 0; line-height: 1.6;">{{synergyRole.description}}</p>
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
                <h3 style="font-family: 'Outfit', sans-serif; font-size: 15pt; font-weight: 700; color: var(--primary); margin: 0 0 4mm 0; letter-spacing: -0.5px;">Portfolio Score</h3>
                <p style="font-size: 11pt; margin-bottom: 0; line-height: 1.7;">Your consolidated performance score is <strong style="color: var(--secondary); font-size: 14pt; font-family: 'Outfit', sans-serif;">{{round report.scores.overall}}%</strong>. This indicates a state of <strong style="color: {{gaugeColor report.scores.overall}};">{{getClassification report.scores.overall}} Efficiency</strong> across your organizational footprint.</p>
            </div>
        </div>

        <div class="card card-insight">
            <div class="block-title">Key Strategic Intelligence</div>
            <p style="font-size: 12.5pt; font-weight: 600; color: var(--primary); line-height: 1.7; margin: 0; letter-spacing: -0.2px;">{{aiInsight.description}}</p>
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


    </div>

    {{#each domainPages}}
    <!-- DOMAIN ANALYSIS PAGE -->
    <div class="page page-flow" style="display: block;">


        <div class="domain-header-box">
            <h1>{{name}}</h1>
            <div class="domain-desc">{{description}}</div>
        </div>

        <div class="score-summary-box" style="background: {{gaugeColor score}};">
            <div style="position: absolute; right: -50px; top: -50px; width: 150px; height: 150px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
            <div>
                <div class="score-label">Domain Efficiency</div>
                <div class="score-value-large">{{round score}}%</div>
            </div>
            <div style="text-align: right; z-index: 1;">
                <div class="score-label">Maturity Level</div>
                <div class="score-value-large" style="font-size: 20pt; text-transform: uppercase;">{{getClassification score}}</div>
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

            <p style="font-size: 11pt; line-height: 1.7; color: var(--text); margin-bottom: 8mm;">{{description}}</p>

            <div style="background: #f1f5f9; padding: 6mm 8mm; border-radius: 4mm; border-left: 5px solid var(--primary); margin-bottom: 10mm;">
                <div class="block-title" style="margin-bottom: 3mm; color: var(--primary);">Contextual Insight</div>
                {{#each insight}}
                <div style="font-size: 10.5pt; line-height: 1.6; color: var(--text); margin-bottom: 2mm;">{{this}}</div>
                {{/each}}
            </div>

            <div class="sub-metrics-grid">
                <div class="sub-metric-box" style="border-top: 4px solid var(--secondary);">
                    <div class="sub-metric-title">Priority Actions (OKRs)</div>
                    <ul class="bullet-list">
                        {{#each okrs}}
                        <li class="bullet-item">
                            <div class="bullet-dot"></div>
                            {{this}}
                        </li>
                        {{/each}}
                    </ul>
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
                <div class="block-title" style="margin-bottom: 4mm;">Recommended Programs</div>
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

            templateData.domainPages = ["People Potential", "Operational Steadiness", "Digital Fluency"].map(dName => {
                const dData = report.scores?.domains?.[dName];
                if (!dData) return null;
                const fb = dData.feedback || {};

                const subdomains = domainStructure[dName].map(sName => {
                    const subData = dData.subdomains?.[sName];
                    const subScore = typeof subData === 'object' ? subData.score : (subData || 60);
                    const subFb = dData.subdomainFeedback?.[sName] || {};
                    const fallbacks = {
                        "Mindset & Adaptability": {
                            insight: "Adaptability exists in parts of the organization, but it varies by team or leader. The foundation is present, yet not consistent enough to create enterprise-wide resilience.",
                            okrs: ["Normalize learning, adjustment, and feedback loops", "Equip managers to reinforce resilience locally", "Watch for uneven readiness across functions"],
                            coaching: ["Model vulnerability when things don't go as planned", "Incentivize small experiments and fast learning", "Review change load at a team level regularly"],
                            model: "Focuses on the cognitive and emotional agility required to navigate complex change, emphasizing psychological safety and rapid experimentation.",
                            programs: ["Leadership Resilience Labs", "Change Readiness Accelerator", "Growth Mindset Workshop"]
                        },
                        "Psychological Health & Safety": {
                            insight: "Psychological health and safety are not yet experienced consistently. People may hesitate to raise concerns or challenge ideas, increasing risk to culture.",
                            okrs: ["Model candor and non-defensive listening", "Close the loop on concerns quickly", "Make respectful challenge a leadership expectation"],
                            coaching: ["Ask 'what is one thing we aren't talking about?'", "Respond to mistakes with curiosity, not blame", "Publicly acknowledge and reward candid feedback"],
                            model: "A framework for building high-trust environments where interpersonal risk-taking is safe, driving innovation and error reduction.",
                            programs: ["Safety & Trust Intensives", "Inclusive Leadership Program", "Candor and Feedback Training"]
                        },
                        "Relational & Emotional Intelligence": {
                            insight: "Healthy collaboration exists in places, yet some interactions still create unnecessary strain, confusion, or avoidance between teams.",
                            okrs: ["Make feedback frequent and specific", "Strengthen manager confidence in difficult conversations", "Watch for teams where tension is going unaddressed"],
                            coaching: ["Practice 'Active Listening' in all leadership meetings", "Encourage cross-functional empathy exercises", "Hold leaders accountable for the 'how' as much as the 'what'"],
                            model: "Centers on social-emotional skills that facilitate high-impact collaboration and resolve interpersonal friction effectively.",
                            programs: ["Emotional Intelligence for Leaders", "Conflict Resolution Mastery", "Team Dynamics Workshop"]
                        },
                        "Prioritization": {
                            insight: "Strategic priorities are generally defined, but consistency in reinforcement varies. Focus drifts when urgent requests or local pressures rise.",
                            okrs: ["Revisit priorities monthly or quarterly", "Create an escalation path for competing work", "Monitor where shadow priorities are emerging"],
                            coaching: ["Say 'no' or 'not now' to non-critical requests publicly", "Ensure every team can name their top 3 priorities", "Align resource allocation strictly to core objectives"],
                            model: "The POD-360 Prioritization Model aligns daily task execution with long-term strategic objectives to prevent 'prioritization fatigue'.",
                            programs: ["Strategic Focus Boot Camp", "Time & Priority Management", "Executive Decision Making"]
                        },
                        "Workflow Clarity": {
                            insight: "Most workflows are understood, but consistency breaks down across handoffs. Execution depends too much on individual effort instead of reliable routines.",
                            okrs: ["Prioritize workflows with the highest business impact", "Define expected steps and owners clearly", "Look for recurring bottlenecks between functions"],
                            coaching: ["Map out the 'messiest' handoff process this month", "Standardize documentation for core operating routines", "Remove low-value steps that slow down delivery"],
                            model: "Emphasizes the standardization of core operating routines to reduce cognitive load and increase operational reliability.",
                            programs: ["Process Optimization Training", "Operational Excellence Suite", "Workflow Design Lab"]
                        },
                        "Effective Resource Management": {
                            insight: "Resources are mostly aligned, but adjustments are often made late. Strain builds when priorities shift faster than resource decisions do.",
                            okrs: ["Monitor where work is outpacing capacity", "Build earlier visibility into resource risks", "Balance short-term delivery with sustainable workload"],
                            coaching: ["Use capacity data to drive planning conversations", "Protect high-performers from 'collaboration overload'", "Stop work that no longer aligns with current strategy"],
                            model: "Optimizes the balance between human capital and project demand, focusing on sustainable performance and burnout prevention.",
                            programs: ["Capacity Planning Mastery", "Resource Allocation Strategy", "Sustainable Performance Lab"]
                        },
                        "Data, AI & Automation Readiness": {
                            insight: "There is growing interest in automation, but usage is inconsistent. The foundation exists, yet value is not fully embedded into everyday work.",
                            okrs: ["Reinforce where data should inform decisions", "Share successful use cases across teams", "Clarify where AI can and cannot add value today"],
                            coaching: ["Highlight one 'Data Win' in every monthly meeting", "Incentivize automation of repetitive manual tasks", "Provide safe spaces for AI experimentation and failure"],
                            model: "Evaluates and bridges the gap between technological capability and human adoption, focusing on value-led digital transformation.",
                            programs: ["AI Strategy for Leaders", "Data Literacy Certification", "Digital Adoption Program"]
                        },
                        "Digital Communication & Collaboration": {
                            insight: "Collaboration tools are in place, but practices vary. The organization lacks the consistency needed for seamless collaboration at scale.",
                            okrs: ["Align teams on shared collaboration habits", "Improve consistency in file sharing and updates", "Reduce dependency on ad hoc workarounds"],
                            coaching: ["Establish 'Rules of Engagement' for digital tools", "Centralize project communication in one shared space", "Model efficient use of asynchronous communication"],
                            model: "Standardizes digital behaviors and tool usage to eliminate communication friction in distributed and hybrid work environments.",
                            programs: ["Digital Habits Boot Camp", "Async Collaboration Mastery", "Tool Proficiency Workshop"]
                        },
                        "Mindset, Confidence and Change Readiness": {
                            insight: "There is moderate openness to change, but confidence varies. Some parts of the organization are moving forward while others need more support.",
                            okrs: ["Normalize learning and adjustment", "Focus support where readiness is uneven", "Use managers as confidence-builders"],
                            coaching: ["Celebrate the 'pivot' as much as the 'plan'", "Create peer-support networks for major changes", "Clearly communicate the 'why' behind digital shifts"],
                            model: "Assesses and builds the psychological readiness and technical confidence required for continuous digital evolution.",
                            programs: ["Confidence in Change Program", "Digital Leadership Academy", "Resilience Training"]
                        },
                        "Tool & System Proficiency": {
                            insight: "Basic proficiency exists, but many users are not fully comfortable using tools to their full value, limiting overall productivity.",
                            okrs: ["Move beyond awareness into applied skill-building", "Use peer learning and practical examples", "Focus on common pain points by role"],
                            coaching: ["Create 'Cheat Sheets' for most common workflows", "Dedicate time for team-led tool training", "Measure tool adoption and address specific gaps"],
                            model: "Focuses on maximizing the ROI of existing technology investments through deep user proficiency and optimized workflows.",
                            programs: ["Advanced Tool Training", "Platform Power User Program", "Digital Efficiency Labs"]
                        }
                    };

                    const fallback = fallbacks[sName] || {
                        insight: "Consistency in this area varies across teams.",
                        okrs: [],
                        coaching: [],
                        model: "The POD-360 model emphasizes consistent leadership application and data-driven feedback loops.",
                        programs: ["Leadership Excellence Labs", "Executive Performance Toolkit"]
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
                        okrs: getBulletedLines(subFb.objectives || "", 5).concat(defaultOkrs).slice(0, 5),
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
                    okrs: getBulletedLines(fb.objectives || "", 5),
                    coaching: getBulletedLines(fb.coachingTips || "", 5),
                    subdomainPages: chunkedSubdomains
                };
            }).filter(p => p !== null);
        }
        return this._template(templateData);
    }
}
export default new PDFReportService();
