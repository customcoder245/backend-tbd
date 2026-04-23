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
            "Mindset & Adaptability": "The ability to stay resilient, learn from setbacks, and adapt to changing conditions and priorities.",
            "Psychological Health & Safety": "The environment of trust where people feel safe to speak up, share ideas, and raise concerns without fear.",
            "Relational & Emotional Intelligence": "The quality of interpersonal communication, empathy, and constructive conflict resolution across teams.",
            "Prioritization": "The clarity and discipline in focusing on the highest-value work while managing competing requests.",
            "Workflow Clarity": "The transparency of roles, processes, and handoffs that ensure work moves forward without unnecessary bottlenecks.",
            "Effective Resource Management": "The alignment of time, talent, and capacity to support sustainable delivery and prevent overload.",
            "Data, AI & Automation Readiness": "The ability to access data and use emerging technologies to improve decision-making and reduce manual friction.",
            "Digital Communication & Collaboration": "The effective use of shared digital tools and norms to keep teams synchronized and productive.",
            "Mindset, Confidence and Change Readiness": "The openness and confidence of individuals to adopt new digital tools and ways of working.",
            "Tool & System Proficiency": "The practical skill and confidence in using the organization's core systems and technological infrastructure."
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

    async generateReport(data, stream) {
        const buffer = await this.generateReportBuffer(data);
        stream.write(buffer);
        stream.end();
    }

    async generateReportBuffer(data) {
        const html = this._buildHTML(data);
        let browser;

        try {
            if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
                // Vercel / Production Environment
                const chromium = (await import('@sparticuz/chromium')).default;
                const puppeteerCore = (await import('puppeteer-core')).default;

                browser = await puppeteerCore.launch({
                    args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
                    defaultViewport: chromium.defaultViewport,
                    executablePath: await chromium.executablePath(),
                    headless: chromium.headless,
                });
            } else {
                // Local Development Environment
                const puppeteer = (await import('puppeteer')).default;
                browser = await puppeteer.launch({
                    headless: 'new',
                    args: ['--no-sandbox', '--disable-setuid-sandbox']
                });
            }

            const page = await browser.newPage();
            await page.setContent(html, { waitUntil: 'networkidle0' });
            return await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
                displayHeaderFooter: false
            });
        } catch (error) {
            console.error("Puppeteer Launch Error:", error);
            throw error;
        } finally {
            if (browser) await browser.close();
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
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        
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

        body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; color: var(--text); line-height: 1.6; background: var(--white); -webkit-print-color-adjust: exact; }
        .page { width: 210mm; height: 297mm; padding: 22mm 18mm; box-sizing: border-box; position: relative; page-break-after: always; display: flex; flex-direction: column; background: var(--white); }
        .page:last-child { page-break-after: auto; }

        /* Headers & Footers */
        .inner-header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 1.5px solid var(--border); padding-bottom: 5mm; margin-bottom: 12mm; }
        .inner-header .report-tag { font-size: 8.5pt; font-weight: 800; color: var(--secondary); text-transform: uppercase; letter-spacing: 1.5px; }
        .inner-header .logo-small { height: 7mm; opacity: 0.9; }
        
        .inner-footer { position: absolute; bottom: 12mm; left: 18mm; right: 18mm; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border); padding-top: 5mm; font-size: 8pt; color: var(--light-text); font-weight: 500; }

        /* Cover Page Redesign */
        .cover-page { padding: 0; display: flex; flex-direction: row; overflow: hidden; background: #fafafa; }
        .cover-sidebar { width: 85mm; height: 100%; background: var(--primary); display: flex; flex-direction: column; align-items: center; padding-top: 30mm; position: relative; }
        .cover-sidebar::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 40%; background: linear-gradient(to top, rgba(0,0,0,0.2), transparent); }
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
        .domain-header-box::after { content: 'POD-360'; position: absolute; right: -5mm; top: -5mm; font-size: 60pt; font-weight: 900; opacity: 0.05; }
        .domain-desc { font-size: 11pt; color: rgba(255,255,255,0.8); margin-top: 3mm; line-height: 1.5; font-weight: 400; }
        .domain-header-box h1 { color: white; margin: 0; }

        /* Tables */
        .table-container { margin: 6mm 0; border-radius: 4mm; overflow: hidden; border: 1px solid var(--border); box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
        .table { width: 100%; border-collapse: collapse; }
        .table th { background: var(--accent); text-align: left; padding: 4mm 5mm; font-size: 9pt; font-weight: 800; color: var(--primary); text-transform: uppercase; letter-spacing: 1px; }
        .table td { padding: 4.5mm 5mm; border-bottom: 1px solid var(--border); font-size: 10.5pt; vertical-align: middle; }
        .table tr:last-child td { border-bottom: none; }
        .table tr:hover { background: var(--accent); }

        /* Status Badges */
        .badge { display: inline-flex; align-items: center; padding: 1.5mm 4mm; border-radius: 50px; font-size: 8.5pt; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
        .badge::before { content: ''; width: 2mm; height: 2mm; border-radius: 50%; margin-right: 2.5mm; }
        .badge-flow { background: #ECFDF5; color: var(--flow); }
        .badge-flow::before { background: var(--flow); }
        .badge-resistance { background: #FFFBEB; color: var(--resistance); }
        .badge-resistance::before { background: var(--resistance); }
        .badge-friction { background: #FEF2F2; color: var(--friction); }
        .badge-friction::before { background: var(--friction); }

        /* Bullet Lists */
        .bullet-list { list-style: none; padding: 0; margin: 0; }
        .bullet-item { display: flex; margin-bottom: 4mm; font-size: 10.5pt; align-items: flex-start; color: var(--text); }
        .bullet-dot { width: 6px; height: 6px; background: var(--secondary); border-radius: 1.5mm; margin-right: 4mm; margin-top: 1.8mm; flex-shrink: 0; box-shadow: 0 0 0 3px rgba(68, 140, 210, 0.1); }
        
        /* Domain Specific */
        .score-summary-box { display: flex; justify-content: space-between; align-items: center; color: white; padding: 8mm 12mm; border-radius: 4mm; margin-bottom: 10mm; box-shadow: 0 8px 16px rgba(0,0,0,0.08); }
        .score-label { font-size: 9.5pt; font-weight: 600; opacity: 0.85; text-transform: uppercase; letter-spacing: 1px; }
        .score-value-large { font-size: 26pt; font-weight: 800; }

        /* Subdomain Deep Dive */
        .subdomain-detail-card { border: 1.5px solid var(--border); border-left-width: 6px; padding: 6mm 8mm; border-radius: 4mm; margin-bottom: 8mm; background: var(--white); box-shadow: 0 2px 6px rgba(0,0,0,0.02); }
        .subdomain-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4mm; padding-bottom: 3mm; border-bottom: 1px solid var(--accent); }
        .subdomain-name { font-size: 13pt; font-weight: 800; color: var(--primary); }
        .subdomain-generic-desc { font-size: 9.5pt; color: var(--light-text); line-height: 1.4; margin: 4mm 0; font-style: italic; }
        .subdomain-insight-text { font-size: 10.5pt; color: var(--text); line-height: 1.6; background: var(--accent); padding: 5mm; border-radius: 3mm; margin-bottom: 5mm; border-left: 3px solid var(--border); }
        
        .sub-metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 8mm; }
        .sub-metric-label { font-weight: 800; color: var(--primary); text-transform: uppercase; font-size: 8.5pt; margin-bottom: 4mm; display: flex; align-items: center; opacity: 0.7; }
        .sub-metric-label::after { content: ''; flex: 1; height: 1px; background: var(--border); margin-left: 3mm; }
    </style>
</head>
<body>
    <!-- LANDING PAGE (COVER) -->
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
            <p style="font-weight: 700; color: {{colors.secondary}}; margin-bottom: 2mm; font-size: 9pt; text-transform: uppercase; letter-spacing: 1px;">From: THE DATA SYNERGY</p>
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
                <p>This report provides a high-level analysis of your current organizational state, pinpointing critical areas of <strong>Friction</strong> and identifying opportunities to accelerate <strong>Flow</strong>.</p>
                <p style="margin-bottom: 0;">Your overall performance score is <strong>{{round report.scores.overall}}%</strong>, indicating a state of <strong>{{getClassification report.scores.overall}}</strong>.</p>
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
                    <tr>
                        <td style="font-weight: 600;">{{name}}</td>
                        <td style="font-weight: 700; color: {{colors.primary}};">{{round score}}%</td>
                        <td><span class="badge badge-{{toLowerCase (getClassification score)}}">{{getClassification score}}</span></td>
                    </tr>
                    {{/each}}
                </tbody>
            </table>
        </div>

        <div class="inner-footer">
            <div>Confidential Assessment Report • {{userName}}</div>
            <div>Talent By Design • Page 2</div>
        </div>
    </div>

    <!-- DOMAIN PAGES -->
    {{#each domainPages}}
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
            <div>
                <div class="score-label">Domain Efficiency Score</div>
                <div class="score-value-large">{{round score}}%</div>
            </div>
            <div style="text-align: right;">
                <div class="score-label">Current State</div>
                <div class="score-value-large" style="font-size: 18pt;">{{getClassification score}}</div>
            </div>
        </div>

        <div class="card" style="margin-bottom: 6mm;">
            <div class="card-accent"></div>
            <div class="block-title">Qualitative Insights</div>
            <ul class="bullet-list">
                {{#each insights}}<li class="bullet-item"><div class="bullet-dot"></div>{{this}}</li>{{/each}}
            </ul>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8mm;">
            <div class="card" style="margin-bottom: 0;">
                <div class="card-accent" style="background: var(--flow);"></div>
                <div class="block-title">Strategic Actions</div>
                <ul class="bullet-list">
                    {{#each okrs}}<li class="bullet-item"><div class="bullet-dot"></div>{{this}}</li>{{/each}}
                </ul>
            </div>

            <div class="card" style="margin-bottom: 0;">
                <div class="card-accent" style="background: var(--secondary);"></div>
                <div class="block-title">Leadership Focus</div>
                <ul class="bullet-list">
                    {{#each coaching}}<li class="bullet-item"><div class="bullet-dot"></div>{{this}}</li>{{/each}}
                </ul>
            </div>
        </div>

        <div class="inner-footer">
            <div>Confidential Assessment Report • {{../../userName}} • {{name}}</div>
            <div>Talent By Design • Page {{add (multiply @index 2) 3}}</div>
        </div>
    </div>

    <!-- SUB-DOMAIN DEEP DIVE PAGE -->
    <div class="page">
        <div class="inner-header">
            <div class="report-tag">{{name}} • Sub-Domain Analysis</div>
            <img src="${BRAND_LOGO_URL}" class="logo-small" />
        </div>

        <h1>Sub-Domain Deep Dive</h1>
        <p style="margin-bottom: 6mm;">A granular analysis of the performance drivers within the <strong>{{name}}</strong> domain.</p>

        {{#each subdomains}}
        <div class="subdomain-detail-card" style="border-left-color: {{gaugeColor score}};">
            <div class="subdomain-header">
                <div class="subdomain-name">{{name}}</div>
                <span class="badge badge-{{toLowerCase state}}">{{score}}% • {{state}}</span>
            </div>
            <div class="subdomain-generic-desc">{{description}}</div>
            <div class="subdomain-insight-text">{{insight}}</div>
            
            <div class="sub-metrics">
                <div class="sub-metric-box">
                    <div class="sub-metric-label">Priority Actions</div>
                    <ul class="bullet-list">
                        {{#each objectives}}<li class="bullet-item" style="font-size: 8.5pt; margin-bottom: 1mm;"><div class="bullet-dot" style="width: 4px; height: 4px; margin-top: 1.2mm;"></div>{{this}}</li>{{/each}}
                    </ul>
                </div>
                <div class="sub-metric-box">
                    <div class="sub-metric-label">Growth Tips</div>
                    <ul class="bullet-list">
                        {{#each coaching}}<li class="bullet-item" style="font-size: 8.5pt; margin-bottom: 1mm;"><div class="bullet-dot" style="width: 4px; height: 4px; margin-top: 1.2mm; background: {{../../../colors.lightText}};"></div>{{this}}</li>{{/each}}
                    </ul>
                </div>
            </div>
        </div>
        {{/each}}

        <div class="inner-footer">
            <div>Confidential Assessment Report • {{../../userName}} • {{name}}</div>
            <div>Talent By Design • Page {{add (multiply @index 2) 4}}</div>
        </div>
    </div>
    {{/each}}

    <!-- PATH FORWARD PAGE -->
    <div class="page">
        <div class="inner-header">
            <div class="report-tag">POD-360™ • Strategic Path Forward</div>
            <img src="${BRAND_LOGO_URL}" class="logo-small" />
        </div>

        <h1>Conclusion & Path Forward</h1>
        <p>This assessment represents a snapshot of your organizational health. The journey from <strong>Friction to Flow</strong> is ongoing, and these insights provide the roadmap for your next phase of growth.</p>

        <div class="card" style="margin-top: 8mm;">
            <div class="card-accent" style="background: {{colors.primary}};"></div>
            <div class="block-title">Key Organizational Priority</div>
            <p style="font-size: 11.5pt; color: {{colors.primary}}; font-weight: 500;">
                Our analysis indicates that the most immediate opportunity for impact lies within <strong>{{lowestDomainName}}</strong>.
            </p>
            <p style="margin-top: 2mm;">Focusing your resources here will resolve critical bottlenecks and accelerate performance across all other domains. Prioritize the OKRs identified in the Deep Dive section of this report.</p>
        </div>

        <div class="card">
            <div class="card-accent"></div>
            <div class="block-title">Implementation Roadmap</div>
            <ul class="bullet-list">
                <li class="bullet-item"><div class="bullet-dot"></div><strong>Phase 1: Awareness (Week 1-2)</strong><br/>Share the POD-360™ findings with leadership and key stakeholders to build a shared language around Friction and Flow.</li>
                <li class="bullet-item"><div class="bullet-dot"></div><strong>Phase 2: Alignment (Week 3-4)</strong><br/>Integrate the recommended OKRs into your quarterly planning. Assign owners to each priority action.</li>
                <li class="bullet-item"><div class="bullet-dot"></div><strong>Phase 3: Activation (Month 2-3)</strong><br/>Execute the growth tips provided in the Coaching & Development sections. Monitor the "Flow" indicators weekly.</li>
            </ul>
        </div>

        <div style="margin-top: auto; padding: 10mm; background: {{colors.sidebar}}; border-radius: 4mm; display: flex; align-items: center; gap: 8mm;">
            <div style="flex: 1;">
                <div style="font-size: 14pt; font-weight: 700; color: {{colors.primary}}; margin-bottom: 2mm;">Scale Your Potential</div>
                <p style="font-size: 10pt; margin-bottom: 0;">For a tailored interpretation of these results or to facilitate a strategic workshop with your team, reach out to our performance consultants.</p>
            </div>
            <div style="text-align: right;">
                <div style="font-size: 12pt; font-weight: 700; color: {{colors.secondary}};">Talent By Design</div>
                <div style="font-size: 9pt; color: {{colors.lightText}};">www.talentbydesign.com</div>
            </div>
        </div>

        <div class="inner-footer">
            <div>Confidential Assessment Report • {{userName}}</div>
            <div>Talent By Design • Page 9</div>
        </div>
    </div>
    {{/unless}}




    {{#if isMasterReport}}
    <!-- MASTER REPORT OVERVIEW -->
    <div class="page">
        <div class="inner-header">
            <div class="report-tag">POD-360™ Organizational Overview</div>
            <img src="${BRAND_LOGO_URL}" class="logo-small" />
        </div>

        <h1>Organizational Health</h1>
        
        <div class="card" style="display: flex; align-items: center; justify-content: space-between; padding: 12mm; margin-bottom: 12mm; background: var(--accent);">
            <div class="card-accent" style="background: {{gaugeColor orgHealth}}; width: 8px;"></div>
            <div>
                <div class="block-title" style="border: none; margin-bottom: 2mm;">Aggregate Performance Index</div>
                <p style="margin: 0; opacity: 0.8; font-size: 11pt;">The combined performance across all evaluated teams and domains.</p>
                <div class="badge badge-{{toLowerCase orgState}}" style="margin-top: 5mm; padding: 2mm 8mm; font-size: 10pt;">{{orgState}} State</div>
            </div>
            <div style="font-size: 68pt; font-weight: 800; color: {{gaugeColor orgHealth}}; line-height: 1; letter-spacing: -3px;">{{orgHealth}}%</div>
        </div>
        
        <h2>Domain Benchmarks</h2>
        <p>Comparison of internal team performance against global organizational benchmarks.</p>
        <div class="table-container">
            <table class="table">
                <thead><tr><th>Domain Area</th><th>Current Team Avg</th><th>Global Benchmark</th><th>Status</th></tr></thead>
                <tbody>
                    {{#each masterDomainRows}}
                    <tr>
                        <td style="font-weight: 600;">{{name}}</td>
                        <td style="font-weight: 700; color: {{../colors.primary}};">{{avg}}%</td>
                        <td style="color: {{../colors.secondary}}; font-weight: 600;">{{benchmark}}%</td>
                        <td><span class="badge badge-{{toLowerCase state}}">{{state}}</span></td>
                    </tr>
                    {{/each}}
                </tbody>
            </table>
        </div>

        <div class="inner-footer">
            <div>Confidential Organizational Report • {{orgName}}</div>
            <div>Talent By Design • Page 2</div>
        </div>
    </div>

    <!-- STRATEGIC ALIGNMENT PAGE -->
    <div class="page">
        <div class="inner-header">
            <div class="report-tag">POD-360™ • Strategic Alignment Analysis</div>
            <img src="${BRAND_LOGO_URL}" class="logo-small" />
        </div>

        <h1>Alignment & Risk Analysis</h1>
        <p style="margin-bottom: 8mm;">Identifying disconnects between leadership vision and employee experience across key domains.</p>
        
        <div style="display: grid; grid-template-columns: 1fr; gap: 6mm;">
            {{#each alignmentRisks}}
            <div class="card" style="margin-bottom: 0; padding: 10mm;">
                <div class="card-accent" style="background: {{color}};"></div>
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4mm;">
                    <div>
                        <div style="font-size: 8pt; color: {{../colors.lightText}}; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 1mm;">Domain Analysis</div>
                        <div style="font-weight: 700; color: {{../colors.primary}}; font-size: 16pt;">{{name}}</div>
                    </div>
                    <span class="badge" style="background: {{color}}22; color: {{color}}; padding: 2mm 6mm;">{{status}}</span>
                </div>
                <p style="margin: 0; font-size: 11pt; line-height: 1.6;">{{info}}</p>
                
                {{#if (includes status "RISK")}}
                <div style="margin-top: 5mm; padding: 4mm; background: #FFF5F5; border-radius: 2mm; border: 1px solid #FED7D7; font-size: 9.5pt; color: #C53030;">
                    <strong>Action Required:</strong> Immediate intervention recommended to bridge the perception gap and restore operational trust.
                </div>
                {{/if}}
            </div>
            {{/each}}
        </div>

        <div class="inner-footer">
            <div>Confidential Organizational Report • {{orgName}}</div>
            <div>Talent By Design • Page 3</div>
        </div>
    </div>
    {{/if}}

</body>
</html>
        `;

        // Register Helpers
        const helpers = {
            round: (val) => Math.round(val || 0),
            inc: (val) => (val || 0) + 1,
            getClassification: (score) => {
                const s = Math.round(score || 0);
                if (s < 50) return "Friction";
                if (s < 75) return "Resistance";
                return "Flow";
            },
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
            includes: (str, substr) => (str || "").includes(substr)
        };



        Object.keys(helpers).forEach(name => handlebars.registerHelper(name, helpers[name]));

        const getBulletedLines = (text, limit = 8) => {
            if (!text) return [];
            return text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0).slice(0, limit);
        };

        const templateData = {
            colors: this.colors, userName, orgName, dateStr, isMasterReport, report, aiInsight, comparisonData,
            synergyIntro: this.synergyIntro
        };

        // Determine Role for Synergy Text
        const roleKey = (report?.stakeholder || user?.role || "employee").toLowerCase();
        templateData.synergyRole = this.roleSynergyData[roleKey] || this.roleSynergyData["employee"];

        if (isMasterReport) {
            const domainNames = ["People Potential", "Operational Steadiness", "Digital Fluency"];
            let totalHealth = 0;
            templateData.masterDomainRows = domainNames.map(d => {
                const avg = Math.round(comparisonData.teamAvg?.[d]?.avgScore || 0);
                totalHealth += avg;
                return {
                    name: d, avg, benchmark: Math.round(comparisonData.orgAvg?.[d]?.avgScore || 0),
                    state: this._getClassification(avg)
                };
            });
            templateData.orgHealth = Math.round(totalHealth / 3);
            templateData.orgState = this._getClassification(templateData.orgHealth);
            templateData.alignmentRisks = domainNames.map(d => {
                const l = comparisonData.leaderAvg?.[d]?.avgScore || 0;
                const e = comparisonData.employeeAvg?.[d]?.avgScore || 0;
                const gap = l - e;
                let status = "Aligned", color = this.colors.flow, info = "Leadership and employee experiences are synchronized.";
                if (gap > 15) { status = "Risk High"; color = this.colors.friction; info = "Significant disconnect observed between leadership and staff."; }
                else if (gap > 7) { status = "Monitor"; color = this.colors.resistance; info = "Minor gap observed. Keep an eye on alignment."; }
                return { name: d, status: status.toUpperCase(), color, info };
            });
        } else {
            templateData.domainPages = ["People Potential", "Operational Steadiness", "Digital Fluency"].map(dName => {
                const dData = report.scores?.domains?.[dName];
                if (!dData) return null;
                const fb = dData.feedback || {};
                
                // Detailed Subdomain Mapping
                const subdomains = Object.keys(dData.subdomains || {}).map(s => {
                    const subScore = typeof dData.subdomains[s] === 'object' ? dData.subdomains[s].score : dData.subdomains[s];
                    const subFb = dData.subdomainFeedback?.[s] || {};
                    return {
                        name: s,
                        description: this.subdomainDescriptions[s] || "",
                        score: Math.round(subScore),
                        state: this._getClassification(subScore),
                        insight: subFb.insight || "No specific insight available for this area.",
                        objectives: getBulletedLines(subFb.objectives || "", 3),
                        coaching: getBulletedLines(subFb.coachingTips || "", 3)
                    };
                });

                return {
                    name: dName, score: dData.score,
                    description: this.domainDescriptions[dName] || "",
                    subdomains,
                    insights: getBulletedLines(fb.insight || fb.modelDescription || "", 5),
                    okrs: getBulletedLines(fb.objectives || "", 5),
                    coaching: getBulletedLines(fb.coachingTips || "", 5)
                };
            }).filter(p => p !== null);

            // Find lowest domain for the conclusion
            const validDomains = templateData.domainPages.filter(d => d !== null);
            if (validDomains.length > 0) {
                const lowest = validDomains.reduce((prev, curr) => (prev.score < curr.score) ? prev : curr);
                templateData.lowestDomainName = lowest.name;
            }
        }


        return handlebars.compile(templateSource)(templateData);
    }

    _getClassification(score) {
        const s = Math.round(score || 0);
        if (s < 50) return "Friction";
        if (s < 75) return "Resistance";
        return "Flow";
    }
}


export default new PDFReportService();
