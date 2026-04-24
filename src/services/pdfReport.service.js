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
        if (s < 50) return "Friction";
        if (s < 75) return "Resistance";
        return "Flow";
    }

    async generateReport(data, stream) {
        const buffer = await this.generateReportBuffer(data);
        stream.write(buffer);
        stream.end();
    }

    async _getBrowser() {
        // Reuse browser instance if it's still alive
        if (this._browser && this._browser.isConnected()) {
            return this._browser;
        }

        console.log("[PDFService] Launching new browser instance...");
        try {
            if (process.env.RENDER || process.env.NODE_ENV === 'production') {
                const puppeteer = (await import('puppeteer')).default;
                this._browser = await puppeteer.launch({
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-gpu',
                        '--no-zygote',
                        '--single-process'
                    ],
                    headless: 'new'
                });
            } else if (process.env.VERCEL) {
                const puppeteerCore = (await import('puppeteer-core')).default;
                const chromium = (await import('@sparticuz/chromium')).default;
                
                // Optimized Vercel launch: No remote download if possible
                this._browser = await puppeteerCore.launch({
                    args: chromium.args,
                    defaultViewport: chromium.defaultViewport,
                    executablePath: await chromium.executablePath(),
                    headless: chromium.headless,
                });
            } else {
                const puppeteerCore = (await import('puppeteer-core')).default;
                const localPaths = [
                    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
                    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
                    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
                    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
                ];

                let executablePath = null;
                const fs = await import('fs');
                for (const p of localPaths) {
                    if (fs.existsSync(p)) {
                        executablePath = p;
                        break;
                    }
                }

                this._browser = await puppeteerCore.launch({
                    headless: 'new',
                    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
                    executablePath: executablePath || undefined
                });
            }
            return this._browser;
        } catch (error) {
            console.error("[PDFService] Browser launch failed:", error.message);
            throw error;
        }
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
            page.setDefaultNavigationTimeout(10000); 
            page.setDefaultTimeout(10000);

            console.log("[PDFService] Rendering content...");
            await page.setContent(html, { 
                waitUntil: 'domcontentloaded'
            });
            
            console.log("[PDFService] Printing PDF...");
            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
                displayHeaderFooter: false,
                timeout: 10000
            });

            return pdfBuffer;
        } catch (error) {
            console.error("PDF GENERATION ERROR:", error.message);
            // If browser crashed, reset it
            if (error.message.includes('Browser closed') || error.message.includes('disconnected')) {
                this._browser = null;
            }
            throw error;
        } finally {
            if (page) {
                await page.close();
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
            --border: {{colors.border}};
            --white: {{colors.white}};
            --accent: {{colors.accent}};
            --card-shadow: 0 10px 25px -5px rgba(26, 54, 82, 0.06), 0 8px 10px -6px rgba(26, 54, 82, 0.06);
        }

        * { font-display: swap; box-sizing: border-box; }
        body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; }

        .page { 
            width: 210mm; 
            height: 297mm; 
            padding: 22mm 18mm; 
            position: relative; 
            display: flex; 
            flex-direction: column; 
            background: var(--white); 
            page-break-after: always; 
            break-after: page;
            overflow: hidden;
        }
        .page:last-of-type { page-break-after: auto; break-after: auto; }

        /* Headers & Footers */
        .page::before {
            content: "POD-360";
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 150pt;
            font-weight: 900;
            color: rgba(241, 245, 249, 0.3);
            z-index: -1;
            pointer-events: none;
        }
        .inner-header { position: relative; z-index: 1; display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid var(--accent); padding-bottom: 5mm; margin-bottom: 12mm; }
        .inner-header .report-tag { font-size: 8.5pt; font-weight: 800; color: var(--secondary); text-transform: uppercase; letter-spacing: 2px; }
        .inner-header .logo-small { height: 8mm; }
        
        .inner-footer { position: absolute; bottom: 12mm; left: 18mm; right: 18mm; display: flex; justify-content: space-between; align-items: center; border-top: 1.5px solid var(--accent); padding-top: 5mm; font-size: 8pt; color: var(--light-text); font-weight: 600; }

        /* Cover Page */
        .cover-page { padding: 0; display: flex; flex-direction: row; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); }
        .cover-sidebar { width: 90mm; height: 100%; background: var(--primary); display: flex; flex-direction: column; align-items: center; padding-top: 35mm; position: relative; overflow: hidden; }
        .cover-sidebar::after { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: radial-gradient(circle at 30% 20%, rgba(255,255,255,0.05) 0%, transparent 50%); }
        .cover-content { flex: 1; padding: 45mm 22mm; display: flex; flex-direction: column; position: relative; }
        
        .logo-white { width: 60mm; filter: brightness(0) invert(1); z-index: 2; }
        .brand-header { font-size: 26pt; font-weight: 800; color: var(--primary); margin-bottom: 2mm; letter-spacing: 3px; }
        .brand-tagline { font-size: 9pt; font-weight: 600; color: var(--secondary); text-transform: uppercase; letter-spacing: 2.5px; margin-bottom: 35mm; }
        .report-title { font-size: 64pt; font-weight: 800; color: var(--primary); margin-bottom: 6mm; line-height: 0.85; letter-spacing: -3px; }
        .report-subtitle { font-size: 22pt; color: var(--primary); font-weight: 400; margin-bottom: 35mm; letter-spacing: -0.5px; }
        .report-subtitle strong { font-weight: 800; color: var(--secondary); }

        .info-block { margin-top: auto; display: grid; grid-template-columns: 1fr 1fr; gap: 10mm; }
        .info-group { margin-bottom: 8mm; }
        .info-label { font-size: 7.5pt; font-weight: 800; color: var(--light-text); text-transform: uppercase; margin-bottom: 2mm; letter-spacing: 1.5px; }
        .info-value { font-size: 14pt; font-weight: 600; color: var(--primary); }

        /* Typography */
        h1 { font-size: 30pt; font-weight: 800; color: var(--primary); margin: 0 0 10mm 0; letter-spacing: -1.5px; line-height: 1.1; }
        h2 { font-size: 20pt; font-weight: 800; color: var(--primary); margin: 12mm 0 8mm 0; display: flex; align-items: center; letter-spacing: -0.5px; }
        h2::before { content: ''; width: 8mm; height: 2mm; background: var(--secondary); display: inline-block; margin-right: 5mm; border-radius: 1mm; }
        p { font-size: 11pt; color: var(--text); margin-bottom: 5mm; line-height: 1.7; }

        /* Inner Cards */
        .card { background: #FFFFFF; padding: 10mm; border-radius: 6mm; margin-bottom: 10mm; border: 1px solid var(--border); box-shadow: var(--card-shadow); position: relative; }
        .card-accent { position: absolute; left: 0; top: 10mm; bottom: 10mm; width: 6px; border-radius: 0 3mm 3mm 0; background: var(--secondary); }
        .block-title { font-weight: 800; color: var(--primary); font-size: 9.5pt; margin-bottom: 5mm; text-transform: uppercase; letter-spacing: 2px; display: flex; align-items: center; }
        .block-title::after { content: ''; flex: 1; height: 2px; background: linear-gradient(to right, var(--accent), transparent); margin-left: 6mm; }

        /* Visuals */
        .summary-hero { display: flex; align-items: center; gap: 18mm; margin-bottom: 12mm; background: linear-gradient(135deg, var(--accent) 0%, #ffffff 100%); padding: 10mm; border-radius: 6mm; border: 1px solid var(--border); }
        .visual-container { position: relative; width: 260px; height: 150px; }
        .gauge-val { position: absolute; top: 60%; left: 50%; transform: translate(-50%, -50%); font-size: 36pt; font-weight: 800; color: var(--primary); letter-spacing: -1px; }
        .gauge-label { position: absolute; top: 92%; left: 50%; transform: translate(-50%, -50%); font-size: 10pt; font-weight: 800; color: var(--secondary); text-transform: uppercase; letter-spacing: 1.5px; }

        /* Domain Header */
        .domain-header-box { background: linear-gradient(135deg, var(--primary) 0%, #2c5282 100%); color: white; padding: 12mm; border-radius: 6mm; margin-bottom: 12mm; position: relative; overflow: hidden; box-shadow: 0 10px 30px rgba(26, 54, 82, 0.15); }
        .domain-header-box::after { content: ''; position: absolute; top: -50%; right: -20%; width: 300px; height: 300px; background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%); border-radius: 50%; }
        .domain-desc { font-size: 12pt; color: rgba(255,255,255,0.9); margin-top: 4mm; line-height: 1.6; font-weight: 400; max-width: 90%; }
        .domain-header-box h1 { color: white; margin: 0; font-size: 32pt; }

        /* Tables */
        .table-container { margin: 8mm 0; border-radius: 6mm; overflow: hidden; border: 1px solid var(--border); box-shadow: var(--card-shadow); }
        .table { width: 100%; border-collapse: collapse; }
        .table th { background: #f8fafc; text-align: left; padding: 5mm 6mm; font-size: 9.5pt; font-weight: 800; color: var(--primary); text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 2px solid var(--accent); }
        .table td { padding: 5.5mm 6mm; border-bottom: 1px solid var(--accent); font-size: 11pt; vertical-align: middle; color: var(--text); }
        .table tr:last-child td { border-bottom: none; }

        /* Status Badges */
        .badge { display: inline-flex; align-items: center; padding: 2mm 5mm; border-radius: 50px; font-size: 9pt; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
        .badge-flow { background: #d1fae5; color: #065f46; }
        .badge-resistance { background: #fef3c7; color: #92400e; }
        .badge-friction { background: #fee2e2; color: #991b1b; }

        /* Bullet Lists */
        .bullet-list { list-style: none; padding: 0; margin: 0; }
        .bullet-item { display: flex; margin-bottom: 5mm; font-size: 11pt; align-items: flex-start; color: var(--text); line-height: 1.5; }
        .bullet-dot { width: 8px; height: 8px; background: var(--secondary); border-radius: 50%; margin-right: 5mm; margin-top: 2.2mm; flex-shrink: 0; box-shadow: 0 0 0 3px var(--accent); }
        
        .score-summary-box { display: flex; justify-content: space-between; align-items: center; color: white; padding: 10mm 14mm; border-radius: 6mm; margin-bottom: 12mm; box-shadow: 0 15px 35px -5px rgba(0,0,0,0.15); position: relative; overflow: hidden; }
        .score-summary-box::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(to right, rgba(0,0,0,0.1), transparent); }
        .score-label { font-size: 10pt; font-weight: 700; opacity: 0.9; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 2mm; position: relative; }
        .score-value-large { font-size: 32pt; font-weight: 800; position: relative; }

        .subdomain-detail-card { border: 1px solid var(--border); border-left: 8px solid var(--secondary); padding: 8mm 10mm; border-radius: 6mm; margin-bottom: 10mm; background: var(--white); box-shadow: var(--card-shadow); }
        .subdomain-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5mm; padding-bottom: 4mm; border-bottom: 1px solid var(--accent); }
        .subdomain-name { font-size: 15pt; font-weight: 800; color: var(--primary); }
        .subdomain-insight-text { font-size: 11pt; color: var(--text); line-height: 1.7; background: #f8fafc; padding: 6mm; border-radius: 4mm; margin-bottom: 6mm; border: 1px solid var(--border); }
        
        .sub-metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 10mm; }
        .sub-metric-label { font-weight: 800; color: var(--primary); text-transform: uppercase; font-size: 9pt; margin-bottom: 5mm; display: flex; align-items: center; opacity: 0.8; }
    </style>
</head>
<body>
    <!-- COVER PAGE -->
    <div class="page cover-page">
        <div class="cover-sidebar">
            <img src="${BRAND_LOGO_URL}" class="logo-white" />
        </div>
        <div class="cover-content">
            <div style="margin-bottom: 25mm;">
                <div class="brand-header">TALENT BY DESIGN</div>
                <div class="brand-tagline">SCALING HUMAN POTENTIAL IN A DIGITAL WORLD</div>
            </div>
            
            <div style="flex: 1;">
                <div class="report-title">POD-360™</div>
                <div class="report-subtitle">Confidential <strong>Performance Profile</strong></div>
                
                <div style="width: 25mm; height: 3px; background: var(--secondary); margin-bottom: 30mm; border-radius: 2px;"></div>
            </div>
            
            <div class="info-block">
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
                    <div class="info-value" style="color: var(--flow); display: flex; align-items: center; gap: 2mm;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        Verified
                    </div>
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
        <div class="inner-footer"><div>Confidential Assessment Report • {{userName}}</div><div>Talent By Design • Page 2</div></div>
    </div>

    {{#each domainPages}}
    <!-- DOMAIN PAGE -->
    <div class="page">
        <div class="inner-header">
            <div class="report-tag">POD-360™ • Domain Analysis</div>
            <img src="${BRAND_LOGO_URL}" class="logo-small" />
        </div>
        <div class="domain-header-box">
            <h1 style="margin-bottom: 3mm;">{{name}}</h1>
            <div class="domain-desc">{{description}}</div>
        </div>
        <div class="score-summary-box" style="background: linear-gradient(135deg, {{gaugeColor score}} 0%, {{gaugeColor score}}dd 100%);">
            <div><div class="score-label">Domain Efficiency Score</div><div class="score-value-large">{{round score}}%</div></div>
            <div style="text-align: right;"><div class="score-label">Current State</div><div class="score-value-large" style="font-size: 20pt; text-transform: uppercase; letter-spacing: 1px;">{{getClassification score}}</div></div>
        </div>
        <div class="card">
            <div class="card-accent"></div>
            <div class="block-title">Qualitative Insights</div>
            <ul class="bullet-list">{{#each insights}}<li class="bullet-item"><div class="bullet-dot"></div>{{this}}</li>{{/each}}</ul>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10mm; margin-top: 4mm;">
            <div class="card" style="margin-bottom: 0;"><div class="card-accent" style="background: var(--flow);"></div><div class="block-title">Strategic Actions</div><ul class="bullet-list">{{#each okrs}}<li class="bullet-item" style="font-size: 10pt; margin-bottom: 3mm;"><div class="bullet-dot" style="width: 6px; height: 6px; margin-top: 1.8mm;"></div>{{this}}</li>{{/each}}</ul></div>
            <div class="card" style="margin-bottom: 0;"><div class="card-accent"></div><div class="block-title">Leadership Focus</div><ul class="bullet-list">{{#each coaching}}<li class="bullet-item" style="font-size: 10pt; margin-bottom: 3mm;"><div class="bullet-dot" style="width: 6px; height: 6px; margin-top: 1.8mm;"></div>{{this}}</li>{{/each}}</ul></div>
        </div>
        <div class="inner-footer"><div>Confidential Assessment Report • {{../userName}}</div><div>Talent By Design • Page {{add (multiply @index 2) 3}}</div></div>
    </div>

    <!-- SUB-DOMAIN PAGE -->
    <div class="page">
        <div class="inner-header">
            <div class="report-tag">{{name}} • Sub-Domain Analysis</div>
            <img src="${BRAND_LOGO_URL}" class="logo-small" />
        </div>
        <h1 style="margin-top: 5mm;">Sub-Domain Deep Dive</h1>
        <p style="color: var(--text); margin-bottom: 10mm; font-size: 11.5pt;">A granular analysis of the performance drivers within the <strong>{{name}}</strong> domain. These metrics pinpoint specific areas for targeted intervention.</p>
        
        <div style="display: flex; flex-direction: column; gap: 8mm;">
        {{#each subdomains}}
        <div class="subdomain-detail-card" style="border-left-color: {{gaugeColor score}};">
            <div class="subdomain-header">
                <div class="subdomain-name">{{name}}</div>
                <div style="display: flex; align-items: center; gap: 4mm;">
                    <div style="font-size: 14pt; font-weight: 800; color: {{gaugeColor score}};">{{round score}}%</div>
                    <span class="badge badge-{{toLowerCase state}}">{{state}}</span>
                </div>
            </div>
            <p style="font-style: italic; font-size: 9.5pt; color: var(--primary); margin-bottom: 4mm; font-weight: 500; opacity: 0.8;">{{description}}</p>
            <div class="subdomain-insight-text">
                {{insight}}
            </div>

            <div class="sub-metrics">
                <div>
                    <div class="sub-metric-label"><div style="width: 12px; height: 2px; background: var(--secondary); margin-right: 3mm;"></div>Priority Actions</div>
                    <ul class="bullet-list">
                        {{#each okrs}}<li class="bullet-item" style="font-size: 9pt; margin-bottom: 2mm;"><div class="bullet-dot" style="width: 5px; height: 5px; margin-top: 1.5mm;"></div>{{this}}</li>{{/each}}
                    </ul>
                </div>
                <div>
                    <div class="sub-metric-label"><div style="width: 12px; height: 2px; background: var(--secondary); margin-right: 3mm;"></div>Growth Tips</div>
                    <ul class="bullet-list">
                        {{#each coaching}}<li class="bullet-item" style="font-size: 9pt; margin-bottom: 2mm;"><div class="bullet-dot" style="width: 5px; height: 5px; margin-top: 1.5mm;"></div>{{this}}</li>{{/each}}
                    </ul>
                </div>
            </div>
        </div>
        {{/each}}
        </div>
        <div class="inner-footer"><div>Confidential Assessment Report • {{../userName}}</div><div>Talent By Design • Page {{add (multiply @index 2) 4}}</div></div>
    </div>
    {{/each}}

    <!-- CONCLUSION PAGE -->
    <div class="page">
        <div class="inner-header"><div class="report-tag">POD-360™ • Strategic Path Forward</div><img src="${BRAND_LOGO_URL}" class="logo-small" /></div>
        <h1 style="margin-top: 5mm; font-size: 32pt;">Conclusion & Path Forward</h1>
        <p style="color: var(--text); line-height: 1.7; margin-bottom: 12mm; font-size: 11.5pt;">This assessment represents a snapshot of your organizational health. The journey from <strong>Friction to Flow</strong> is ongoing, and these insights provide the roadmap for your next phase of growth. Consistency and alignment are the keys to scaling your human potential.</p>
        
        <div class="card" style="padding: 10mm; margin-bottom: 12mm; border-left: 6px solid var(--primary);">
            <div class="block-title" style="margin-bottom: 5mm;">Key Organizational Priority</div>
            <p style="font-size: 12pt; line-height: 1.7; color: var(--primary); font-weight: 500;">Our analysis indicates that the most immediate opportunity for impact lies within your focus areas. Focusing your resources here will resolve critical bottlenecks and accelerate performance across all other domains.</p>
        </div>

        <div class="card" style="padding: 10mm; background: #fcfcfc;">
            <div class="card-accent" style="background: var(--secondary);"></div>
            <div class="block-title" style="margin-bottom: 6mm;">Implementation Roadmap</div>
            <div style="margin-bottom: 6mm; display: flex; gap: 6mm;">
                <div style="font-weight: 800; color: var(--secondary); font-size: 10pt; min-width: 40mm; text-transform: uppercase;">Phase 1: Awareness</div>
                <div><p style="font-size: 10pt; margin: 0;">Share the findings with leadership to build a shared language around Friction and Flow. Normalize the data across all teams.</p></div>
            </div>
            <div style="margin-bottom: 6mm; display: flex; gap: 6mm;">
                <div style="font-weight: 800; color: var(--secondary); font-size: 10pt; min-width: 40mm; text-transform: uppercase;">Phase 2: Alignment</div>
                <div><p style="font-size: 10pt; margin: 0;">Integrate the recommended OKRs into your quarterly planning. Assign owners to each priority action to ensure accountability.</p></div>
            </div>
            <div style="display: flex; gap: 6mm;">
                <div style="font-weight: 800; color: var(--secondary); font-size: 10pt; min-width: 40mm; text-transform: uppercase;">Phase 3: Activation</div>
                <div><p style="font-size: 10pt; margin: 0;">Execute the growth tips provided in the Coaching sections. Monitor the "Flow" indicators weekly and adjust as needed.</p></div>
            </div>
        </div>
        
        <div style="margin-top: auto; padding-bottom: 20mm;">
            <div style="color: {{colors.secondary}}; margin: 0 0 5mm 0; font-size: 26pt; font-weight: 800; line-height: 1.1;">Scale Your Potential</div>
        </div>

        <div class="inner-footer" style="height: auto; flex-direction: column; align-items: stretch; padding-top: 6mm; border-top: 2px solid var(--accent);">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4mm; font-size: 8.5pt; color: var(--light-text); font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                <div>Confidential Assessment Report • {{userName}}</div>
                <div>Talent By Design • Page 9</div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: flex-end;">
                <div style="font-size: 11pt; color: var(--text); max-width: 60%; line-height: 1.5; font-weight: 500;">Reach out to our performance consultants for a tailored workshop.</div>
                <div style="text-align: right;">
                    <div style="font-weight: 800; color: {{colors.secondary}}; font-size: 20pt; line-height: 1.1; margin-bottom: 1mm;">Talent By Design</div>
                    <div style="font-size: 10pt;"><a href="https://talent-by-design.vercel.app/" style="color: {{colors.secondary}}; text-decoration: none; font-weight: 700;">https://talent-by-design.vercel.app/</a></div>
                </div>
            </div>
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
            return text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0).slice(0, limit);
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
                    let subInsight = subFb.insight || "";
                    let defaultOkrs = [];
                    let defaultCoaching = [];
                    
                    if (!subInsight) {
                        const fallbacks = {
                            "Mindset & Adaptability": {
                                insight: "Adaptability exists in parts of the organization, but it varies by team or leader. The foundation is present, yet not consistent enough to create enterprise-wide resilience.",
                                okrs: ["Normalize learning, adjustment, and feedback loops", "Equip managers to reinforce resilience locally", "Watch for uneven readiness across functions"],
                                coaching: ["Model vulnerability when things don't go as planned", "Incentivize small experiments and fast learning", "Review change load at a team level regularly"]
                            },
                            "Psychological Health & Safety": {
                                insight: "Psychological health and safety are not yet experienced consistently. People may hesitate to raise concerns or challenge ideas, increasing risk to culture.",
                                okrs: ["Model candor and non-defensive listening", "Close the loop on concerns quickly", "Make respectful challenge a leadership expectation"],
                                coaching: ["Ask 'what is one thing we aren't talking about?'", "Respond to mistakes with curiosity, not blame", "Publicly acknowledge and reward candid feedback"]
                            },
                            "Relational & Emotional Intelligence": {
                                insight: "Healthy collaboration exists in places, yet some interactions still create unnecessary strain, confusion, or avoidance between teams.",
                                okrs: ["Make feedback frequent and specific", "Strengthen manager confidence in difficult conversations", "Watch for teams where tension is going unaddressed"],
                                coaching: ["Practice 'Active Listening' in all leadership meetings", "Encourage cross-functional empathy exercises", "Hold leaders accountable for the 'how' as much as the 'what'"]
                            },
                            "Prioritization": {
                                insight: "Strategic priorities are generally defined, but consistency in reinforcement varies. Focus drifts when urgent requests or local pressures rise.",
                                okrs: ["Revisit priorities monthly or quarterly", "Create an escalation path for competing work", "Monitor where shadow priorities are emerging"],
                                coaching: ["Say 'no' or 'not now' to non-critical requests publicly", "Ensure every team can name their top 3 priorities", "Align resource allocation strictly to core objectives"]
                            },
                            "Workflow Clarity": {
                                insight: "Most workflows are understood, but consistency breaks down across handoffs. Execution depends too much on individual effort instead of reliable routines.",
                                okrs: ["Prioritize workflows with the highest business impact", "Define expected steps and owners clearly", "Look for recurring bottlenecks between functions"],
                                coaching: ["Map out the 'messiest' handoff process this month", "Standardize documentation for core operating routines", "Remove low-value steps that slow down delivery"]
                            },
                            "Effective Resource Management": {
                                insight: "Resources are mostly aligned, but adjustments are often made late. Strain builds when priorities shift faster than resource decisions do.",
                                okrs: ["Monitor where work is outpacing capacity", "Build earlier visibility into resource risks", "Balance short-term delivery with sustainable workload"],
                                coaching: ["Use capacity data to drive planning conversations", "Protect high-performers from 'collaboration overload'", "Stop work that no longer aligns with current strategy"]
                            },
                            "Data, AI & Automation Readiness": {
                                insight: "There is growing interest in automation, but usage is inconsistent. The foundation exists, yet value is not fully embedded into everyday work.",
                                okrs: ["Reinforce where data should inform decisions", "Share successful use cases across teams", "Clarify where AI can and cannot add value today"],
                                coaching: ["Highlight one 'Data Win' in every monthly meeting", "Incentivize automation of repetitive manual tasks", "Provide safe spaces for AI experimentation and failure"]
                            },
                            "Digital Communication & Collaboration": {
                                insight: "Collaboration tools are in place, but practices vary. The organization lacks the consistency needed for seamless collaboration at scale.",
                                okrs: ["Align teams on shared collaboration habits", "Improve consistency in file sharing and updates", "Reduce dependency on ad hoc workarounds"],
                                coaching: ["Establish 'Rules of Engagement' for digital tools", "Centralize project communication in one shared space", "Model efficient use of asynchronous communication"]
                            },
                            "Mindset, Confidence and Change Readiness": {
                                insight: "There is moderate openness to change, but confidence varies. Some parts of the organization are moving forward while others need more support.",
                                okrs: ["Normalize learning and adjustment", "Focus support where readiness is uneven", "Use managers as confidence-builders"],
                                coaching: ["Celebrate the 'pivot' as much as the 'plan'", "Create peer-support networks for major changes", "Clearly communicate the 'why' behind digital shifts"]
                            },
                            "Tool & System Proficiency": {
                                insight: "Basic proficiency exists, but many users are not fully comfortable using tools to their full value, limiting overall productivity.",
                                okrs: ["Move beyond awareness into applied skill-building", "Use peer learning and practical examples", "Focus on common pain points by role"],
                                coaching: ["Create 'Cheat Sheets' for most common workflows", "Dedicate time for team-led tool training", "Measure tool adoption and address specific gaps"]
                            }
                        };
                        const fallback = fallbacks[sName] || { insight: "Consistency in this area varies across teams.", okrs: [], coaching: [] };
                        subInsight = fallback.insight;
                        defaultOkrs = fallback.okrs;
                        defaultCoaching = fallback.coaching;
                    }

                    return {
                        name: sName,
                        score: Math.round(subScore),
                        state: this._getClassification(subScore),
                        description: this.subdomainDescriptions[sName] || "",
                        insight: subInsight,
                        okrs: getBulletedLines(subFb.objectives || "", 3).concat(defaultOkrs).slice(0, 3),
                        coaching: getBulletedLines(subFb.coachingTips || "", 3).concat(defaultCoaching).slice(0, 3)
                    };
                });

                return {
                    name: dName, 
                    score: Math.round(dData.score),
                    state: this._getClassification(dData.score),
                    description: this.domainDescriptions[dName] || "",
                    insights: getBulletedLines(fb.insight || fb.modelDescription || "", 5),
                    okrs: getBulletedLines(fb.objectives || "", 5),
                    coaching: getBulletedLines(fb.coachingTips || "", 5),
                    subdomains
                };
            }).filter(p => p !== null);
        }

        return this._template(templateData);
    }
}

export default new PDFReportService();
