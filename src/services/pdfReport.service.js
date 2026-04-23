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

    async generateReportBuffer(data) {
        const html = this._buildHTML(data);
        let browser;

        try {
            if (process.env.RENDER || process.env.NODE_ENV === 'production') {
                console.log("[PDFService] Render/Production environment. Launching Puppeteer...");
                const puppeteer = (await import('puppeteer')).default;
                browser = await puppeteer.launch({
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-gpu'
                    ],
                    headless: 'new'
                });
            } else if (process.env.VERCEL) {
                console.log("[PDFService] Vercel environment. Initializing Chromium with remote pack...");
                const puppeteerCore = (await import('puppeteer-core')).default;
                const chromium = (await import('@sparticuz/chromium')).default;
                const executablePath = await chromium.executablePath(
                    'https://github.com/Sparticuz/chromium/releases/download/v123.0.1/chromium-v123.0.1-pack.tar'
                );

                browser = await puppeteerCore.launch({
                    args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
                    defaultViewport: chromium.defaultViewport,
                    executablePath: executablePath,
                    headless: chromium.headless,
                });
            } else {
                console.log("[PDFService] Local environment. Finding local Chrome...");
                const puppeteerCore = (await import('puppeteer-core')).default;
                // Common local paths for Chrome/Edge/Brave
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

                browser = await puppeteerCore.launch({
                    headless: 'new',
                    args: ['--no-sandbox', '--disable-setuid-sandbox'],
                    executablePath: executablePath || undefined
                });
            }
            console.log("[PDFService] Browser launched successfully.");

            const page = await browser.newPage();
            
            // Set timeouts
            page.setDefaultNavigationTimeout(30000); 
            page.setDefaultTimeout(30000);

            console.log("[PDFService] Setting content...");
            await page.setContent(html, { 
                waitUntil: 'domcontentloaded', 
                timeout: 30000 
            });
            
            console.log("[PDFService] Generating PDF...");
            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
                displayHeaderFooter: false,
                timeout: 30000
            });

            console.log("[PDFService] PDF generated successfully.");
            return pdfBuffer;
        } catch (error) {
            console.error("PDF GENERATION ERROR:", error.message);
            throw error;
        } finally {
            if (browser) {
                console.log("[PDFService] Closing browser...");
                await browser.close();
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
        }

        * { font-display: swap; }
        .page { 
            width: 210mm; 
            height: 297mm; 
            padding: 22mm 18mm; 
            box-sizing: border-box; 
            position: relative; 
            display: flex; 
            flex-direction: column; 
            background: var(--white); 
            page-break-after: always !important; 
            break-after: page !important;
            clear: both;
        }
        .force-break { page-break-after: always !important; break-after: page !important; height: 0; }
        .page:last-child { page-break-after: auto !important; break-after: auto !important; }

        /* Headers & Footers */
        .inner-header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 1.5px solid var(--border); padding-bottom: 5mm; margin-bottom: 12mm; }
        .inner-header .report-tag { font-size: 8.5pt; font-weight: 800; color: var(--secondary); text-transform: uppercase; letter-spacing: 1.5px; }
        .inner-header .logo-small { height: 7mm; opacity: 0.9; }
        
        .inner-footer { position: absolute; bottom: 12mm; left: 18mm; right: 18mm; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border); padding-top: 5mm; font-size: 8pt; color: var(--light-text); font-weight: 500; }

        /* Cover Page */
        .cover-page { padding: 0; display: flex; flex-direction: row; overflow: hidden; background: #fafafa; }
        .cover-sidebar { width: 85mm; height: 100%; background: var(--primary); display: flex; flex-direction: column; align-items: center; padding-top: 30mm; position: relative; }
        .cover-content { flex: 1; padding: 45mm 20mm; display: flex; flex-direction: column; position: relative; }
        
        .logo-white { width: 55mm; filter: brightness(0) invert(1); }
        .brand-header { font-size: 26pt; font-weight: 800; color: var(--primary); margin-bottom: 2mm; letter-spacing: 2px; }
        .brand-tagline { font-size: 9pt; font-weight: 600; color: var(--secondary); text-transform: uppercase; letter-spacing: 2px; margin-bottom: 35mm; }
        .report-title { font-size: 58pt; font-weight: 800; color: var(--primary); margin-bottom: 6mm; line-height: 0.9; letter-spacing: -2px; }
        .report-subtitle { font-size: 20pt; color: var(--primary); font-weight: 400; margin-bottom: 30mm; }
        .report-subtitle strong { font-weight: 700; color: var(--secondary); }

        .info-block { margin-top: auto; display: grid; grid-template-columns: 1fr 1fr; gap: 8mm; }
        .info-group { margin-bottom: 6mm; }
        .info-label { font-size: 7.5pt; font-weight: 800; color: var(--light-text); text-transform: uppercase; margin-bottom: 2mm; letter-spacing: 1px; }
        .info-value { font-size: 13pt; font-weight: 600; color: var(--primary); }

        /* Typography */
        h1 { font-size: 28pt; font-weight: 800; color: var(--primary); margin: 0 0 8mm 0; letter-spacing: -1px; line-height: 1.1; }
        h2 { font-size: 18pt; font-weight: 700; color: var(--primary); margin: 10mm 0 6mm 0; display: flex; align-items: center; }
        h2::before { content: ''; width: 6mm; height: 1.5mm; background: var(--secondary); display: inline-block; margin-right: 4mm; border-radius: 1mm; }
        p { font-size: 10.5pt; color: var(--text); margin-bottom: 4mm; line-height: 1.6; }

        /* Inner Cards */
        .card { background: #FFFFFF; padding: 8mm; border-radius: 4mm; margin-bottom: 8mm; border: 1px solid var(--border); box-shadow: 0 4px 12px rgba(26, 54, 82, 0.04); position: relative; }
        .card-accent { position: absolute; left: 0; top: 8mm; bottom: 8mm; width: 5px; border-radius: 0 2mm 2mm 0; background: var(--secondary); }
        .block-title { font-weight: 800; color: var(--primary); font-size: 9pt; margin-bottom: 4mm; text-transform: uppercase; letter-spacing: 1.5px; display: flex; align-items: center; }
        .block-title::after { content: ''; flex: 1; height: 1.5px; background: linear-gradient(to right, var(--border), transparent); margin-left: 5mm; }

        /* Visuals */
        .summary-hero { display: flex; align-items: center; gap: 15mm; margin-bottom: 10mm; background: var(--accent); padding: 8mm; border-radius: 5mm; }
        .visual-container { position: relative; width: 240px; height: 140px; }
        .gauge-val { position: absolute; top: 60%; left: 50%; transform: translate(-50%, -50%); font-size: 32pt; font-weight: 800; color: var(--primary); }
        .gauge-label { position: absolute; top: 88%; left: 50%; transform: translate(-50%, -50%); font-size: 9pt; font-weight: 800; color: var(--secondary); text-transform: uppercase; letter-spacing: 1px; }

        /* Domain Header */
        .domain-header-box { background: var(--primary); color: white; padding: 10mm; border-radius: 5mm; margin-bottom: 10mm; position: relative; overflow: hidden; }
        .domain-desc { font-size: 11pt; color: rgba(255,255,255,0.8); margin-top: 3mm; line-height: 1.5; font-weight: 400; }
        .domain-header-box h1 { color: white; margin: 0; }

        /* Tables */
        .table-container { margin: 6mm 0; border-radius: 4mm; overflow: hidden; border: 1px solid var(--border); box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
        .table { width: 100%; border-collapse: collapse; }
        .table th { background: var(--accent); text-align: left; padding: 4mm 5mm; font-size: 9pt; font-weight: 800; color: var(--primary); text-transform: uppercase; letter-spacing: 1px; }
        .table td { padding: 4.5mm 5mm; border-bottom: 1px solid var(--border); font-size: 10.5pt; vertical-align: middle; }

        /* Status Badges */
        .badge { display: inline-flex; align-items: center; padding: 1.5mm 4mm; border-radius: 50px; font-size: 8.5pt; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
        .badge-flow { background: #ECFDF5; color: var(--flow); }
        .badge-resistance { background: #FFFBEB; color: var(--resistance); }
        .badge-friction { background: #FEF2F2; color: var(--friction); }

        /* Bullet Lists */
        .bullet-list { list-style: none; padding: 0; margin: 0; }
        .bullet-item { display: flex; margin-bottom: 4mm; font-size: 10.5pt; align-items: flex-start; color: var(--text); }
        .bullet-dot { width: 6px; height: 6px; background: var(--secondary); border-radius: 1.5mm; margin-right: 4mm; margin-top: 1.8mm; flex-shrink: 0; }
        
        .score-summary-box { display: flex; justify-content: space-between; align-items: center; color: white; padding: 8mm 12mm; border-radius: 4mm; margin-bottom: 10mm; box-shadow: 0 8px 16px rgba(0,0,0,0.08); }
        .score-label { font-size: 9.5pt; font-weight: 600; opacity: 0.85; text-transform: uppercase; letter-spacing: 1px; }
        .score-value-large { font-size: 26pt; font-weight: 800; }

        .subdomain-detail-card { border: 1.5px solid var(--border); border-left-width: 6px; padding: 6mm 8mm; border-radius: 4mm; margin-bottom: 8mm; background: var(--white); }
        .subdomain-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4mm; padding-bottom: 3mm; border-bottom: 1px solid var(--accent); }
        .subdomain-name { font-size: 13pt; font-weight: 800; color: var(--primary); }
        .subdomain-insight-text { font-size: 10.5pt; color: var(--text); line-height: 1.6; background: var(--accent); padding: 5mm; border-radius: 3mm; margin-bottom: 5mm; }
        
        .sub-metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 8mm; }
        .sub-metric-label { font-weight: 800; color: var(--primary); text-transform: uppercase; font-size: 8.5pt; margin-bottom: 4mm; display: flex; align-items: center; opacity: 0.7; }
    </style>
</head>
<body>
    <!-- COVER PAGE -->
    <div class="page cover-page">
        <div class="cover-sidebar">
            <img src="${BRAND_LOGO_URL}" class="logo-white" />
        </div>
        <div class="cover-content">
            <div class="brand-header">TALENT BY DESIGN</div>
            <div class="brand-tagline">SCALING HUMAN POTENTIAL IN A DIGITAL WORLD</div>
            
            <div class="report-title">POD-360™</div>
            <div class="report-subtitle">Confidential <strong>Performance Profile</strong></div>
            
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
                    <div class="info-value">Verified</div>
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
        <div style="margin-bottom: 8mm; border-left: 2px solid {{colors.border}}; padding-left: 6mm;">
            <p style="font-style: italic; margin-bottom: 6mm; color: {{colors.primary}};">{{synergyIntro}}</p>
            <p style="font-weight: 700; color: {{colors.secondary}}; margin-bottom: 2mm; font-size: 9pt; text-transform: uppercase; letter-spacing: 1px;">To: {{synergyRole.name}}</p>
            <p style="color: {{colors.text}}; line-height: 1.5;">{{synergyRole.description}}</p>
        </div>
        <div class="summary-hero">
            <div class="visual-container">
                <svg width="240" height="140" viewBox="0 0 200 100">
                    <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#E2E8F0" stroke-width="18" stroke-linecap="round" />
                    <path d="M 20 100 A 80 80 0 0 1 {{gaugePath 80 report.scores.overall}}" fill="none" stroke="{{gaugeColor report.scores.overall}}" stroke-width="18" stroke-linecap="round" stroke-dasharray="2, 1" />
                    <circle cx="{{gaugePathX 80 report.scores.overall}}" cy="{{gaugePathY 80 report.scores.overall}}" r="6" fill="white" stroke="{{gaugeColor report.scores.overall}}" stroke-width="3" />
                </svg>
                <div class="gauge-val">{{round report.scores.overall}}%</div>
                <div class="gauge-label">{{getClassification report.scores.overall}}</div>
            </div>
            <div style="flex: 1;">
                <p style="font-size: 11pt; font-weight: 500; color: var(--primary); margin-bottom: 3mm;">Performance Overview</p>
                <p>Your overall performance score is <strong>{{round report.scores.overall}}%</strong>, indicating a state of <strong>{{getClassification report.scores.overall}}</strong>.</p>
            </div>
        </div>
        <div class="card">
            <div class="card-accent"></div>
            <div class="block-title">Key Strategic Insight</div>
            <p style="font-size: 12pt; font-weight: 500; color: {{colors.primary}};">{{aiInsight.description}}</p>
        </div>
        <h2>Domain Performance</h2>
        <div class="table-container">
            <table class="table">
                <thead><tr><th>Domain Area</th><th>Score</th><th>Current State</th></tr></thead>
                <tbody>
                    {{#each domainPages}}
                    <tr><td style="font-weight: 600;">{{name}}</td><td style="font-weight: 700; color: {{colors.primary}};">{{round score}}%</td><td><span class="badge badge-{{toLowerCase (getClassification score)}}">{{getClassification score}}</span></td></tr>
                    {{/each}}
                </tbody>
            </table>
        </div>
        <div class="inner-footer"><div>Confidential Assessment Report • {{userName}}</div><div>Talent By Design • Page 2</div></div>
    </div>
    <div class="force-break"></div>

    {{#each domainPages}}
    <!-- DOMAIN PAGE -->
    <div class="page">
        <div class="inner-header">
            <div class="report-tag">POD-360™ • Domain Analysis</div>
            <img src="${BRAND_LOGO_URL}" class="logo-small" />
        </div>
        <div class="domain-header-box">
            <h1 style="margin-bottom: 2mm;">{{name}}</h1>
            <div class="domain-desc">{{description}}</div>
        </div>
        <div class="score-summary-box" style="background: {{gaugeColor score}};">
            <div><div class="score-label">Domain Efficiency Score</div><div class="score-value-large">{{round score}}%</div></div>
            <div style="text-align: right;"><div class="score-label">Current State</div><div class="score-value-large" style="font-size: 18pt;">{{getClassification score}}</div></div>
        </div>
        <div class="card">
            <div class="card-accent"></div>
            <div class="block-title">Qualitative Insights</div>
            <ul class="bullet-list">{{#each insights}}<li class="bullet-item"><div class="bullet-dot"></div>{{this}}</li>{{/each}}</ul>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8mm;">
            <div class="card"><div class="card-accent" style="background: var(--flow);"></div><div class="block-title">Strategic Actions</div><ul class="bullet-list">{{#each okrs}}<li class="bullet-item"><div class="bullet-dot"></div>{{this}}</li>{{/each}}</ul></div>
            <div class="card"><div class="card-accent"></div><div class="block-title">Leadership Focus</div><ul class="bullet-list">{{#each coaching}}<li class="bullet-item"><div class="bullet-dot"></div>{{this}}</li>{{/each}}</ul></div>
        </div>
        <div class="inner-footer"><div>Confidential Assessment Report • {{../userName}}</div><div>Talent By Design • Page {{add (multiply @index 2) 3}}</div></div>
    </div>
    <div class="force-break"></div>

    <!-- SUB-DOMAIN PAGE -->
    <div class="page">
        <div class="inner-header">
            <div class="report-tag">{{name}} • Sub-Domain Analysis</div>
            <img src="${BRAND_LOGO_URL}" class="logo-small" />
        </div>
        <h1 style="margin-top: 5mm;">Sub-Domain Deep Dive</h1>
        <p style="color: {{colors.text}}; margin-bottom: 8mm;">A granular analysis of the performance drivers within the <strong>{{name}}</strong> domain.</p>
        {{#each subdomains}}
        <div class="card" style="margin-bottom: 6mm;">
            <div class="card-accent" style="background: {{gaugeColor score}};"></div>
            <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 2mm;">
                <div class="block-title" style="margin: 0; font-size: 12pt;">{{name}}</div>
                <div style="font-size: 9pt; font-weight: 700; color: {{gaugeColor score}};">{{round score}}% • {{state}}</div>
            </div>
            <p style="font-style: italic; font-size: 8.5pt; color: {{colors.primary}}; margin-bottom: 3mm;">{{description}}</p>
            <div style="background: #f8fafc; padding: 4mm; border-radius: 2mm; border: 1px solid #e2e8f0; margin-bottom: 3mm;">
                <p style="font-size: 8.5pt; line-height: 1.4; color: {{colors.text}};">{{insight}}</p>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4mm;">
                <div>
                    <div style="font-size: 7.5pt; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 2mm; border-bottom: 1px solid #f1f5f9;">Priority Actions</div>
                    <ul class="bullet-list" style="margin: 0; padding: 0;">
                        {{#each okrs}}<li class="bullet-item" style="font-size: 7.5pt; margin-bottom: 1mm;"><div class="bullet-dot" style="width: 3px; height: 3px;"></div>{{this}}</li>{{/each}}
                    </ul>
                </div>
                <div>
                    <div style="font-size: 7.5pt; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 2mm; border-bottom: 1px solid #f1f5f9;">Growth Tips</div>
                    <ul class="bullet-list" style="margin: 0; padding: 0;">
                        {{#each coaching}}<li class="bullet-item" style="font-size: 7.5pt; margin-bottom: 1mm;"><div class="bullet-dot" style="width: 3px; height: 3px;"></div>{{this}}</li>{{/each}}
                    </ul>
                </div>
            </div>
        </div>
        {{/each}}
        <div class="inner-footer"><div>Confidential Assessment Report • {{../userName}}</div><div>Talent By Design • Page {{add (multiply @index 2) 4}}</div></div>
    </div>
    <div class="force-break"></div>
    {{/each}}

    <!-- CONCLUSION PAGE -->
    <div class="page">
        <div class="inner-header"><div class="report-tag">POD-360™ • Strategic Path Forward</div><img src="${BRAND_LOGO_URL}" class="logo-small" /></div>
        <h1 style="margin-top: 10mm; font-size: 28pt;">Conclusion & Path Forward</h1>
        <p style="color: {{colors.text}}; line-height: 1.6; margin-bottom: 12mm;">This assessment represents a snapshot of your organizational health. The journey from <strong>Friction to Flow</strong> is ongoing, and these insights provide the roadmap for your next phase of growth.</p>
        <div class="card" style="padding: 8mm; margin-bottom: 10mm;"><div class="card-accent"></div><div class="block-title" style="margin-bottom: 4mm;">Key Organizational Priority</div><p style="font-size: 11pt; line-height: 1.6;">Our analysis indicates that the most immediate opportunity for impact lies within your focus areas. Focusing your resources here will resolve critical bottlenecks and accelerate performance across all other domains.</p></div>
        <div class="card" style="padding: 8mm;">
            <div class="card-accent" style="background: {{colors.secondary}};"></div>
            <div class="block-title" style="margin-bottom: 4mm;">Implementation Roadmap</div>
            <div style="margin-bottom: 5mm;"><div style="font-weight: 700; color: {{colors.secondary}}; margin-bottom: 1mm;">Phase 1: Awareness (Week 1-2)</div><p style="font-size: 9pt;">Share the findings with leadership to build a shared language around Friction and Flow.</p></div>
            <div style="margin-bottom: 5mm;"><div style="font-weight: 700; color: {{colors.secondary}}; margin-bottom: 1mm;">Phase 2: Alignment (Week 3-4)</div><p style="font-size: 9pt;">Integrate the recommended OKRs into your quarterly planning. Assign owners to each priority action.</p></div>
            <div><div style="font-weight: 700; color: {{colors.secondary}}; margin-bottom: 1mm;">Phase 3: Activation (Month 2-3)</div><p style="font-size: 9pt;">Execute the growth tips provided in the Coaching sections. Monitor the "Flow" indicators weekly.</p></div>
        </div>
        <div style="margin-top: 15mm; display: flex; justify-content: space-between; align-items: flex-end;">
            <div><h3 style="color: {{colors.secondary}}; margin-bottom: 2mm;">Scale Your Potential</h3><p style="font-size: 9pt; color: {{colors.text}};">Reach out to our performance consultants for a tailored workshop.</p></div>
            <div style="text-align: right;"><div style="font-weight: 800; color: {{colors.secondary}}; font-size: 14pt;">Talent By Design</div><div style="font-size: 9pt; color: {{colors.primary}};">www.talentbydesign.com</div></div>
        </div>
        <div class="inner-footer"><div>Confidential Assessment Report • {{userName}}</div><div>Talent By Design • Page 9</div></div>
    </div>
    {{/unless}}
    <div style="page-break-after: always; break-after: page;"></div>
</body>
</html>
        `;

        // Register Helpers
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

        Object.keys(helpers).forEach(name => handlebars.registerHelper(name, helpers[name]));

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

        return handlebars.compile(templateSource)(templateData);
    }
}

export default new PDFReportService();
