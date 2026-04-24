import handlebars from 'handlebars';

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
                margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
                displayHeaderFooter: false,
                timeout: 30000
            });

            return pdfBuffer;
        } catch (error) {
            console.error("PDF GENERATION ERROR:", error.message);
            // If browser crashed, reset it
            if (error.message.includes('Browser closed') || error.message.includes('disconnected')) {
                this._browser = null;
                this._launchingPromise = null;
            }
            throw error;
        } finally {
            if (page) {
                await page.close().catch(e => console.error("Error closing page:", e));
            }
            // We do NOT close the browser here to allow reuse
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
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: {{colors.primary}};
            --secondary: {{colors.secondary}};
            --sidebar: {{colors.sidebar}};
            --friction: {{colors.friction}};
            --flow: {{colors.flow}};
            --resistance: {{colors.resistance}};
            --text: {{colors.text}};
            --light-text: {{colors.lightText}};
            --border: #E2E8F0;
            --white: #FFFFFF;
            --accent: #F8FAFC;
        }

        * { font-display: swap; box-sizing: border-box; }
        body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; font-family: 'Inter', sans-serif; }

        .page { 
            width: 210mm; 
            height: 297mm; 
            padding: 20mm 18mm; 
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

        .inner-header { position: relative; z-index: 1; display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 1px solid var(--border); padding-bottom: 5mm; margin-bottom: 12mm; }
        .inner-header .report-tag { font-size: 8pt; font-weight: 700; color: var(--secondary); text-transform: uppercase; letter-spacing: 1px; }
        .inner-header .logo-small { height: 7mm; }
        
        .inner-footer { position: absolute; bottom: 12mm; left: 18mm; right: 18mm; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border); padding-top: 4mm; font-size: 8pt; color: var(--light-text); font-weight: 500; }

        /* Cover Page */
        .cover-page { padding: 0; display: flex; flex-direction: row; background: var(--white); }
        .cover-sidebar { width: 75mm; height: 100%; background: #438cd1; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; padding-top: 80mm; position: relative; box-shadow: 5px 0 20px rgba(0,0,0,0.05); z-index: 10; }
        .cover-content { flex: 1; padding: 50mm 20mm; display: flex; flex-direction: column; position: relative; background: #FAFAFA; }
        
        .logo-cover { width: 45mm; }
        .brand-header { font-size: 20pt; font-weight: 800; color: var(--primary); margin-bottom: 2mm; letter-spacing: 4px; text-transform: uppercase; }
        .brand-tagline { font-size: 8.5pt; font-weight: 500; color: var(--secondary); text-transform: uppercase; letter-spacing: 3px; margin-bottom: 40mm; }
        
        .report-title-container { border-left: 4px solid var(--secondary); padding-left: 8mm; margin-bottom: 35mm; }
        .report-title { font-size: 28pt; font-weight: 900; color: var(--primary); margin-bottom: 4mm; line-height: 1.2; letter-spacing: 0; }
        .report-subtitle { font-size: 18pt; color: var(--light-text); font-weight: 400; }
        .report-subtitle strong { font-weight: 700; color: var(--primary); }

        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10mm; margin-top: auto; border-top: 1px solid var(--border); padding-top: 10mm; }
        .info-group { margin-bottom: 6mm; }
        .info-label { font-size: 7pt; font-weight: 800; color: var(--light-text); text-transform: uppercase; margin-bottom: 1.5mm; letter-spacing: 1.5px; }
        .info-value { font-size: 11pt; font-weight: 600; color: var(--primary); letter-spacing: 0.5px; }

        /* Typography */
        h1 { font-size: 24pt; font-weight: 900; color: var(--primary); margin: 0 0 6mm 0; letter-spacing: -0.5px; text-transform: uppercase; }
        h2 { font-size: 16pt; font-weight: 700; color: var(--primary); margin: 10mm 0 6mm 0; border-bottom: 1px solid var(--border); padding-bottom: 3mm; letter-spacing: -0.5px; }
        p { font-size: 10pt; color: var(--text); margin-bottom: 4mm; line-height: 1.6; font-weight: 400; }

        /* Inner Cards */
        .card { background: #FFFFFF; padding: 8mm; border-radius: 3mm; margin-bottom: 8mm; border: 1px solid rgba(226, 232, 240, 0.6); box-shadow: 0 4px 15px rgba(0, 0, 0, 0.02); position: relative; }
        .card-accent { position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: var(--secondary); border-radius: 3mm 0 0 3mm; }
        .block-title { font-weight: 800; color: var(--primary); font-size: 8.5pt; margin-bottom: 4mm; text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 1px solid var(--accent); padding-bottom: 2mm; }

        /* Visuals */
        .summary-hero { display: flex; align-items: center; gap: 10mm; margin-bottom: 10mm; background: #FFFFFF; padding: 8mm 12mm; border-radius: 3mm; box-shadow: 0 4px 20px rgba(0,0,0,0.03); border: 1px solid rgba(226, 232, 240, 0.5); }
        .visual-container { position: relative; width: 260px; height: 150px; flex-shrink: 0; }
        .gauge-val { position: absolute; top: 60%; left: 50%; transform: translate(-50%, -50%); font-size: 36pt; font-weight: 900; color: var(--primary); letter-spacing: -2px; }
        .gauge-label { position: absolute; top: 90%; left: 50%; transform: translate(-50%, -50%); font-size: 8pt; font-weight: 800; color: var(--secondary); text-transform: uppercase; letter-spacing: 1.5px; }

        /* Domain Header */
        .domain-header-box { background: linear-gradient(135deg, var(--primary) 0%, #102438 100%); color: white; padding: 12mm; border-radius: 3mm; margin-bottom: 10mm; position: relative; overflow: hidden; box-shadow: 0 8px 25px rgba(26, 54, 82, 0.15); }
        .domain-header-box::after { content: ''; position: absolute; top: 0; right: 0; width: 150px; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.03)); transform: skewX(-15deg); }
        .domain-desc { font-size: 10pt; color: rgba(255,255,255,0.85); margin-top: 4mm; line-height: 1.6; font-weight: 300; max-width: 90%; }
        .domain-header-box h1 { color: white; margin: 0; font-size: 28pt; letter-spacing: -1px; }

        /* Tables */
        .table-container { margin: 6mm 0; border-radius: 2mm; overflow: hidden; border: 1px solid var(--border); box-shadow: 0 2px 10px rgba(0,0,0,0.02); }
        .table { width: 100%; border-collapse: collapse; }
        .table th { background: #F8FAFC; text-align: left; padding: 4mm 5mm; font-size: 8pt; font-weight: 800; color: var(--light-text); text-transform: uppercase; letter-spacing: 1px; }
        .table td { padding: 4mm 5mm; border-bottom: 1px solid var(--border); font-size: 9.5pt; color: var(--text); }
        .table tr:last-child td { border-bottom: none; }

        /* Status Badges */
        .badge { display: inline-flex; align-items: center; padding: 1.5mm 3.5mm; border-radius: 2mm; font-size: 7.5pt; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
        .badge-high { background: rgba(48, 173, 67, 0.1); color: var(--flow); border: 1px solid rgba(48, 173, 67, 0.2); }
        .badge-medium { background: rgba(254, 225, 20, 0.15); color: #B39D00; border: 1px solid rgba(254, 225, 20, 0.3); }
        .badge-low { background: rgba(255, 86, 86, 0.1); color: var(--friction); border: 1px solid rgba(255, 86, 86, 0.2); }

        /* Bullet Lists */
        .bullet-list { list-style: none; padding: 0; margin: 0; }
        .bullet-item { display: flex; margin-bottom: 2.5mm; font-size: 9.5pt; align-items: flex-start; color: var(--text); line-height: 1.5; }
        .bullet-dot { width: 4px; height: 4px; background: var(--secondary); border-radius: 50%; margin-right: 4mm; margin-top: 2.5mm; flex-shrink: 0; }
        
        .score-summary-box { display: flex; justify-content: space-between; align-items: center; color: white; padding: 6mm 10mm; border-radius: 2mm; margin-bottom: 8mm; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
        .score-label { font-size: 8pt; font-weight: 700; text-transform: uppercase; opacity: 0.9; letter-spacing: 1px; }
        .score-value-large { font-size: 24pt; font-weight: 900; letter-spacing: -1px; }

        .subdomain-compact-card { border: 1px solid rgba(226, 232, 240, 0.8); padding: 6mm 8mm; border-radius: 3mm; margin-bottom: 5mm; background: #FFFFFF; position: relative; box-shadow: 0 2px 12px rgba(0,0,0,0.02); }
        .subdomain-compact-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2mm; border-bottom: 1px solid var(--accent); padding-bottom: 2mm; }
        .subdomain-compact-name { font-size: 11.5pt; font-weight: 800; color: var(--primary); letter-spacing: -0.5px; }
        .subdomain-compact-score { font-size: 10pt; font-weight: 800; color: var(--secondary); background: rgba(68, 140, 210, 0.05); padding: 1mm 3mm; border-radius: 2mm; }
        .subdomain-compact-desc { font-size: 8.5pt; color: var(--light-text); font-style: italic; margin-bottom: 4mm; line-height: 1.5; }
        .subdomain-compact-insight { 
            font-size: 9.5pt; 
            color: var(--text); 
            background: #F8FAFC; 
            padding: 4mm 5mm; 
            border-radius: 2mm; 
            margin-bottom: 4mm; 
            border-left: 3px solid var(--secondary); 
            line-height: 1.5; 
            break-inside: avoid;
        }
        .sub-metrics-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 8mm; 
            break-inside: auto;
        }
        .sub-metrics-grid > div {
            break-inside: avoid;
        }
        .sub-metric-title { font-size: 7pt; font-weight: 800; color: var(--primary); text-transform: uppercase; margin-bottom: 3mm; letter-spacing: 1px; }
    </style>
</head>
<body>
    <!-- COVER PAGE -->
    <div class="page cover-page">
        <div class="cover-sidebar">
            <img src="${BRAND_LOGO_URL}" class="logo-cover" />
        </div>
        <div class="cover-content">
            <div class="brand-header">TALENT BY DESIGN</div>
            <div class="brand-tagline">SCALING HUMAN POTENTIAL IN A DIGITAL WORLD</div>
            
            <div class="report-title-container">
                <div class="report-title">POD-360™</div>
                <div class="report-subtitle">Confidential <strong>Performance Profile</strong></div>
            </div>
            
            <div class="info-grid">
                <div class="info-group">
                    <div class="info-label">PARTICIPANT</div>
                    <div class="info-value">{{userName}}</div>
                </div>
                <div class="info-group">
                    <div class="info-label">ORGANIZATION</div>
                    <div class="info-value">{{orgName}}</div>
                </div>
                <div class="info-group">
                    <div class="info-label">DATE ISSUED</div>
                    <div class="info-value">{{dateStr}}</div>
                </div>
                <div class="info-group">
                    <div class="info-label">PROFILE STATUS</div>
                    <div class="info-value" style="color: var(--flow);">Verified</div>
                </div>
            </div>
        </div>
    </div>

    {{#unless isMasterReport}}
    <!-- SUMMARY PAGE -->
    <div class="page">
        <div class="inner-header">
            <div class="report-tag">POD-360™ Performance Profile</div>
            <img src="${BRAND_LOGO_URL}" class="logo-small" />
        </div>
        <h1>THE DATA SYNERGY</h1>
        <div style="margin-bottom: 10mm; border-left: 4px solid var(--secondary); padding-left: 8mm; background: var(--accent); padding-top: 6mm; padding-bottom: 6mm; border-radius: 0 4mm 4mm 0;">
            <p style="font-style: italic; margin-bottom: 4mm; color: var(--primary); font-size: 12pt; font-weight: 500;">{{synergyIntro}}</p>
            <div style="display: flex; align-items: center; gap: 3mm; margin-bottom: 2mm;">
                <div style="width: 10px; height: 10px; background: var(--secondary); border-radius: 2px;"></div>
                <p style="font-weight: 800; color: var(--secondary); margin: 0; font-size: 9.5pt; text-transform: uppercase; letter-spacing: 1.5px;">Recipient: {{synergyRole.name}}</p>
            </div>
            <p style="color: var(--text); line-height: 1.6; margin: 0; font-size: 10.5pt;">{{synergyRole.description}}</p>
        </div>
        <div class="summary-hero">
            <div class="visual-container">
                <svg width="260" height="150" viewBox="0 0 200 110">
                    <defs>
                        <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" style="stop-color:{{gaugeColor report.scores.overall}};stop-opacity:0.6" />
                            <stop offset="100%" style="stop-color:{{gaugeColor report.scores.overall}};stop-opacity:1" />
                        </linearGradient>
                    </defs>
                    <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#e2e8f0" stroke-width="20" stroke-linecap="round" />
                    <path d="M 20 100 A 80 80 0 0 1 {{gaugePath 80 report.scores.overall}}" fill="none" stroke="url(#gaugeGradient)" stroke-width="20" stroke-linecap="round" />
                    <circle cx="{{gaugePathX 80 report.scores.overall}}" cy="{{gaugePathY 80 report.scores.overall}}" r="8" fill="white" stroke="{{gaugeColor report.scores.overall}}" stroke-width="4" />
                </svg>
                <div class="gauge-val">{{round report.scores.overall}}%</div>
                <div class="gauge-label">{{getClassification report.scores.overall}}</div>
            </div>
            <div style="flex: 1;">
                <p style="font-size: 13pt; font-weight: 800; color: var(--primary); margin-bottom: 3mm; letter-spacing: -0.5px;">Performance Overview</p>
                <p style="font-size: 11pt; margin-bottom: 0;">Your overall performance score is <strong style="color: var(--secondary); font-size: 13pt;">{{round report.scores.overall}}%</strong>, indicating a state of <strong style="color: {{gaugeColor report.scores.overall}};">{{getClassification report.scores.overall}}</strong>. This metric aggregates all strategic domains to provide a holistic view of your organizational footprint.</p>
            </div>
        </div>
        <div class="card">
            <div class="card-accent"></div>
            <div class="block-title">Key Strategic Insight</div>
            <p style="font-size: 12.5pt; font-weight: 600; color: var(--primary); line-height: 1.6; margin: 0;">{{aiInsight.description}}</p>
        </div>
        <h2 style="margin-top: 8mm;">Domain Performance</h2>
        <div class="table-container">
            <table class="table">
                <thead><tr><th>Domain Area</th><th>Score</th><th>Current State</th></tr></thead>
                <tbody>
                    {{#each domainPages}}
                    <tr><td style="font-weight: 700; font-size: 11.5pt;">{{name}}</td><td style="font-weight: 800; color: var(--primary); font-size: 12pt;">{{round score}}%</td><td><span class="badge badge-{{toLowerCase (getClassification score)}}">{{getClassification score}}</span></td></tr>
                    {{/each}}
                </tbody>
            </table>
        </div>

    </div>

    {{#each domainPages}}
    <!-- DOMAIN + SUBDOMAIN COMBINED FLOW PAGE -->
    <div class="page page-flow" style="display: block;">
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr>
                    <td style="padding: 0;">
                        <div class="inner-header">
                            <div class="report-tag">POD-360™ • Domain Analysis</div>
                            <img src="${BRAND_LOGO_URL}" class="logo-small" />
                        </div>
                    </td>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style="padding: 0; padding-top: 8mm;">
                        <div class="domain-header-box">
                            <h1 style="margin-bottom: 2mm;">{{name}}</h1>
                            <div class="domain-desc">{{description}}</div>
                        </div>
                        <div class="score-summary-box" style="background: {{gaugeColor score}};">
                            <div><div class="score-label">Domain Efficiency Score</div><div class="score-value-large">{{round score}}%</div></div>
                            <div style="text-align: right;"><div class="score-label">Current State</div><div class="score-value-large" style="font-size: 18pt;">{{getClassification score}}</div></div>
                        </div>

                        <div style="height: 10mm;"></div>

                        <!-- SUBDOMAINS flow directly below -->
                        {{#each subdomainPages}}
                        {{#each this}}
                        <div style="{{#unless @../first}}margin-top: 12mm; border-top: 2px solid var(--border); padding-top: 10mm;{{/unless}}">
                            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 6mm; border-bottom: 2px solid var(--border); padding-bottom: 4mm;">
                                <div>
                                    <div style="font-size: 9pt; color: var(--light-text); font-weight: 700; text-transform: uppercase; margin-bottom: 1mm;">Sub-Domain Analysis</div>
                                    <h1 style="margin: 0; font-size: 20pt; letter-spacing: -0.5px;">{{name}}</h1>
                                </div>
                                <div style="text-align: right;">
                                    <div style="font-size: 22pt; font-weight: 800; color: var(--secondary); line-height: 1;">{{round score}}%</div>
                                    <div style="font-size: 9pt; font-weight: 700; color: var(--light-text); text-transform: uppercase;">Rating: {{state}}</div>
                                </div>
                            </div>

                            <p style="font-size: 10.5pt; line-height: 1.6; color: var(--text); margin-bottom: 8mm; font-weight: 400;">{{description}}</p>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8mm; align-items: start; margin-bottom: 10mm;">
                                <!-- Column 1: Insights -->
                                <div style="break-inside: avoid; page-break-inside: avoid;">
                                    <div style="font-weight: 800; color: var(--secondary); font-size: 9.5pt; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4mm; display: flex; align-items: center; gap: 2mm;">
                                        <div style="width: 8px; height: 8px; background: var(--secondary); border-radius: 2px;"></div>
                                        Insight for {{name}}
                                    </div>
                                    <div class="subdomain-compact-insight" style="margin-bottom: 0; padding: 5mm; background: #F8FAFC; border-left: 4px solid var(--secondary);">
                                        {{#each insight}}
                                        <div style="{{#unless @last}}margin-bottom: 3mm;{{/unless}}; font-size: 10pt; line-height: 1.5; color: #334155;">{{this}}</div>
                                        {{/each}}
                                    </div>
                                </div>

                                <!-- Column 2: Framework -->
                                {{#if modelDescription.length}}
                                <div style="break-inside: avoid; page-break-inside: avoid;">
                                    <div style="font-weight: 800; color: var(--primary); font-size: 9.5pt; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4mm; display: flex; align-items: center; gap: 2mm;">
                                        <div style="width: 8px; height: 8px; background: var(--primary) ; border-radius: 2px;"></div>
                                        POD-360 Model
                                    </div>
                                    <div style="font-size: 10pt; line-height: 1.6; color: var(--text);">
                                        {{#each modelDescription}}
                                        <div style="{{#unless @last}}margin-bottom: 2.5mm;{{/unless}}">• {{this}}</div>
                                        {{/each}}
                                    </div>
                                </div>
                                {{/if}}
                            </div>

                            <!-- ROADMAP SECTION -->
                            <div style="border-top: 1px solid var(--border); padding-top: 10mm; margin-top: 10mm; break-inside: avoid; page-break-inside: avoid;">
                                <div style="margin-bottom: 8mm;">
                                    <div style="font-size: 9pt; color: var(--light-text); font-weight: 700; text-transform: uppercase; margin-bottom: 1mm;">Implementation Roadmap</div>
                                    <h2 style="margin: 0; font-size: 16pt; border: none; padding: 0;">{{name}}: Path Forward</h2>
                                </div>

                                <div class="sub-metrics-grid" style="margin-top: 0; gap: 8mm;">
                                    <div style="background: white; border: 1px solid var(--border); padding: 6mm; border-radius: 4px; border-top: 4px solid var(--secondary);">
                                        <div class="sub-metric-title" style="font-size: 11pt; color: var(--secondary); margin-bottom: 5mm; font-weight: 800;">Priority Actions (OKRs)</div>
                                        <ul class="bullet-list">
                                            {{#each okrs}}<li class="bullet-item" style="font-size: 9.5pt; margin-bottom: 3.5mm;"><div class="bullet-dot" style="width: 5px; height: 5px; margin-top: 1.5mm; background: var(--secondary);"></div>{{this}}</li>{{/each}}
                                        </ul>
                                    </div>
                                    <div style="background: white; border: 1px solid var(--border); padding: 6mm; border-radius: 4px; border-top: 4px solid var(--primary);">
                                        <div class="sub-metric-title" style="font-size: 11pt; color: var(--primary); margin-bottom: 5mm; font-weight: 800;">Growth &amp; Coaching Tips</div>
                                        <ul class="bullet-list">
                                            {{#each coaching}}<li class="bullet-item" style="font-size: 9.5pt; margin-bottom: 3.5mm;"><div class="bullet-dot" style="width: 5px; height: 5px; margin-top: 1.5mm; background: var(--primary);"></div>{{this}}</li>{{/each}}
                                        </ul>
                                    </div>
                                </div>

                                {{#if recommendedPrograms.length}}
                                <div style="margin-top: 10mm; background: #F1F5F9; padding: 7mm; border-radius: 4px; border-left: 5px solid var(--primary); break-inside: avoid;">
                                    <div style="font-weight: 800; color: var(--text); font-size: 10pt; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5mm;">Recommended Development Programs</div>
                                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4mm;">
                                        {{#each recommendedPrograms}}
                                        <div style="display: flex; gap: 3mm; align-items: flex-start; font-size: 9.5pt; color: #334155; line-height: 1.4;">
                                            <div style="min-width: 6px; height: 6px; background: var(--primary); border-radius: 50%; margin-top: 1.5mm;"></div>
                                            {{this}}
                                        </div>
                                        {{/each}}
                                    </div>
                                </div>
                                {{/if}}
                            </div>
                        </div>
                        {{/each}}
                        {{/each}}

                        <div style="height: 15mm;"></div>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
    {{/each}}

    <!-- CONCLUSION PAGE -->
    <div class="page">
        <div class="inner-header"><div class="report-tag">POD-360™ • Strategic Path Forward</div><img src="${BRAND_LOGO_URL}" class="logo-small" /></div>
        <h1 style="margin-top: 5mm;">Conclusion & Path Forward</h1>
        <p>This assessment represents a snapshot of your organizational health. The journey toward <strong>High Performance</strong> is ongoing, and these insights provide the roadmap for your next phase of growth. Consistency and alignment are the keys to scaling your human potential.</p>
        
        <div class="card" style="border-left: 4px solid var(--primary); margin-bottom: 10mm;">
            <div class="block-title">Key Organizational Priority</div>
            <p style="font-weight: 500; color: var(--primary); margin: 0;">Our analysis indicates that the most immediate opportunity for impact lies within your focus areas. Focusing your resources here will resolve critical bottlenecks and accelerate performance across all other domains.</p>
        </div>

        <div class="card" style="background: var(--accent);">
            <div class="block-title" style="color: var(--secondary);">Implementation Roadmap</div>
            <div style="margin-bottom: 6mm; display: grid; grid-template-columns: 45mm 1fr; gap: 4mm; align-items: start;">
                <div style="font-weight: 800; color: var(--secondary); font-size: 9pt; text-transform: uppercase;">Phase 1: Awareness</div>
                <p style="font-size: 10pt; margin: 0;">Share the findings with leadership to build a shared language around Friction and Flow. Normalize the data across all teams.</p>
            </div>
            <div style="margin-bottom: 6mm; display: grid; grid-template-columns: 45mm 1fr; gap: 4mm; align-items: start;">
                <div style="font-weight: 800; color: var(--secondary); font-size: 9pt; text-transform: uppercase;">Phase 2: Alignment</div>
                <p style="font-size: 10pt; margin: 0;">Integrate the recommended OKRs into your quarterly planning. Assign owners to each priority action to ensure accountability.</p>
            </div>
            <div style="display: grid; grid-template-columns: 45mm 1fr; gap: 4mm; align-items: start;">
                <div style="font-weight: 800; color: var(--secondary); font-size: 9pt; text-transform: uppercase;">Phase 3: Activation</div>
                <p style="font-size: 10pt; margin: 0;">Execute the growth tips provided in the Coaching sections. Monitor the "High Performance" indicators weekly and adjust as needed.</p>
            </div>
        </div>
        
        <div style="margin-top: auto; padding-bottom: 15mm; border-bottom: 2px solid var(--secondary);">
            <div style="color: var(--secondary); font-size: 24pt; font-weight: 800; letter-spacing: -1px;">Scale Your Potential</div>
        </div>


    </div>
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
