import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "dns";
import path from "path";
import { fileURLToPath } from "url";
import BenefitsRealization from "../models/benefitsRealization.model.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const seedData = [
  {
    orgName: "Langara College",
    programName: "Langara Collaboration Platform (LCP)",
    pid: "PID 6738",
    waveName: "Admin Group 1 — Privacy & Records Management (PRM)",
    overallScore: 3.9,
    targetScore: 5.0,
    realizationPercentage: 78,
    activeCheckpointNumber: 3,
    pillars: [
      { name: "Delivery", status: "On Track", score: 4.2, summary: "Technical milestones and M365 infrastructure on schedule." },
      { name: "Adoption", status: "On Track", score: 4.5, summary: "100% staff training completed, 227 active files." },
      { name: "Benefits", status: "Progressing", score: 3.9, summary: "Early collaboration gains realized; governance behaviors progressing." },
      { name: "Risk & Security", status: "Monitor", score: 3.2, summary: "Purview labels and FOIPPA compliance require active remediation." }
    ],
    checkpoints: [
      { checkpointNumber: 1, name: "Baseline", targetDate: "Nov 2024", score: 3.5, status: "COMPLETED", notes: "Initial baseline assessment." },
      { checkpointNumber: 2, name: "3-Month Review", targetDate: "Feb 2025", score: 3.6, status: "COMPLETED", notes: "Early progress on file reorganization." },
      { checkpointNumber: 3, name: "90-Day Review (Active Gate 2)", targetDate: "Nov 2026", score: 3.9, status: "ACTIVE", notes: "Current active review gate. Program score 3.9 / 5.0." },
      { checkpointNumber: 4, name: "Quarterly Review", targetDate: "~ Dec 2026", score: 4.2, status: "UPCOMING", notes: "Target post-remediation review." },
      { checkpointNumber: 5, name: "Program Closure", targetDate: "~ Feb 2027", score: 4.5, status: "UPCOMING", notes: "Target final realization sign-off." }
    ],
    outcomes: {
      folderCount: { baseline: 541, current: 44, percentChange: -91.9 },
      duplicateFiles: { baseline: 117, current: 49, percentChange: -58.1 },
      genericNames: { baseline: 347, current: 41, percentChange: -88.2 },
      everyoneGrants: 0,
      folderExceptions: 0,
      trainedStaff: 1151,
      totalStaff: 1151,
      activeFiles: 227
    },
    needsAttention: [
      {
        id: "NA-1",
        category: "SECURITY (M365)",
        severity: "Critical",
        healthStatus: "Weak",
        title: "Records & Security Labelling",
        issue: "Security health: Weak — 0% retention labels applied; 205 potentially sensitive files unlabelled.",
        impact: "Leaves confidential student and administrative records unclassified in SharePoint, risking compliance breach under BC FIPPA.",
        recommendation: "Configure Microsoft Purview auto-labelling rules and security classifications across all PRM document libraries.",
        score: 45
      },
      {
        id: "NA-2",
        category: "HYGIENE",
        severity: "Medium",
        healthStatus: "At Risk",
        title: "Version-Control Maturity & OneDrive Sync Friction",
        issue: "Version-control maturity — 'v2/final/draft' filename habits increasing (468 ➔ 607 files); Site Owner noted friction syncing OneDrive with SP site resulting in manual uploads.",
        impact: "Staff creating redundant file versions rather than utilizing built-in M365 version history, cluttering document search and slowing collaboration.",
        recommendation: "Conduct targeted OCM coaching clinics on OneDrive sync vs. manual uploads and M365 co-authoring practice sessions (Due: Gate 2 +30d).",
        score: 60
      }
    ],
    scorecard: [
      { driverId: "B1", name: "Improved Collaboration & Productivity", score: 4.2, target: 5.0, status: "On Track", evidence: "4.5/5 version control survey, 40.2% ROT reduction (2,175 ➔ 1,300 files)." },
      { driverId: "B2", name: "Enhanced Data Security & Compliance", score: 3.8, target: 5.0, status: "Monitor", evidence: "4.5/5 restricted access confidence, 0 'Everyone' grants; 0% retention labels (205 files unlabelled)." },
      { driverId: "B3", name: "Simplified IT Management", score: 4.0, target: 5.0, status: "On Track", evidence: "4.5/5 support awareness, 15.1% storage reduction (3.90 ➔ 3.31 GB), 0 path length errors." },
      { driverId: "B4", name: "Enable Remote Work & Mobility", score: 3.6, target: 5.0, status: "Monitor", evidence: "3.5/5 off-site work ease; OneDrive sync coaching required to replace manual uploads." },
      { driverId: "B5", name: "Improved Decision-Making & BI", score: 4.1, target: 5.0, status: "On Track", evidence: "Folder depth collapsed 8 ➔ 2 (-75%), 541 ➔ 44 folders (-91.9%), metadata navigation active." },
      { driverId: "B6", name: "Streamlined Processes", score: 3.7, target: 5.0, status: "Progressing", evidence: "4.0/5 collaboration ease; workflow transition underway across PRM libraries." },
      { driverId: "B7", name: "Standardization", score: 3.5, target: 5.0, status: "On Track", evidence: "5.0/5 metadata confidence; generic filenames reduced 347 ➔ 41 (-88.2%)." },
      { driverId: "B8", name: "Improved Adoption", score: 4.5, target: 5.0, status: "On Track", evidence: "4.5/5 training satisfaction, 4.5/5 team responsiveness, 100% staff trained (1,151 staff)." },
      { driverId: "B9", name: "Cost Savings", score: 3.9, target: 5.0, status: "Verified", evidence: "15.1% storage reduction (3.90 ➔ 3.31 GB); >$70k PBX savings; $280k storage avoidance." }
    ],
    stakeholders: [
      { name: "Suzanna de Souza", role: "Organizational Change Manager & SuperAdmin", email: "sdesouza@langara.ca" },
      { name: "Shireen Cardas", role: "Associate Director IT PPM", email: "scardas@langara.ca" },
      { name: "PRM Business Unit Lead", role: "Business Unit Lead & Executive Sponsor", email: "prm-lead@langara.ca" }
    ],
    strategicAlignmentStatement:
      "Advances Langara's Digital Roadmap by modernizing information management, strengthening collaboration, and enabling a more secure, compliant, and efficient service environment.",
    coachingTips: [
      {
        title: "Hold the 'White Space'",
        tip: "To move from reactive firefighting to proactive transformation, protect 20% of your calendar for future-state governance planning."
      },
      {
        title: "Address 'Causing Friction'",
        tip: "When someone resists adopting automated versioning, explore the why. Bridge the gap between 'how we've always named files' and 'co-authoring in M365'."
      }
    ],
    alignmentStatus: {
      seniorLeaderScore: 83,
      managerScore: 78,
      employeeScore: 80,
      largestGap: "SENIOR LEADER VS MANAGER (+5)",
      statusBadge: "HIGH ALIGNMENT",
      narrative: "Low variance detected, the organization is moving with aligned execution."
    }
  },
  // Also seed under WTEC alias for seamless compatibility with local dev test accounts
  {
    orgName: "WTEC",
    programName: "Langara Collaboration Platform (LCP)",
    pid: "PID 6738",
    waveName: "Admin Group 1 — Privacy & Records Management (PRM)",
    overallScore: 3.9,
    targetScore: 5.0,
    realizationPercentage: 78,
    activeCheckpointNumber: 3,
    pillars: [
      { name: "Delivery", status: "On Track", score: 4.2, summary: "Technical milestones and M365 infrastructure on schedule." },
      { name: "Adoption", status: "On Track", score: 4.5, summary: "100% staff training completed, 227 active files." },
      { name: "Benefits", status: "Progressing", score: 3.9, summary: "Early collaboration gains realized; governance behaviors progressing." },
      { name: "Risk & Security", status: "Monitor", score: 3.2, summary: "Purview labels and FOIPPA compliance require active remediation." }
    ],
    checkpoints: [
      { checkpointNumber: 1, name: "Baseline", targetDate: "Nov 2024", score: 3.5, status: "COMPLETED", notes: "Initial baseline assessment." },
      { checkpointNumber: 2, name: "3-Month Review", targetDate: "Feb 2025", score: 3.6, status: "COMPLETED", notes: "Early progress on file reorganization." },
      { checkpointNumber: 3, name: "90-Day Review (Active Gate 2)", targetDate: "Nov 2026", score: 3.9, status: "ACTIVE", notes: "Current active review gate. Program score 3.9 / 5.0." },
      { checkpointNumber: 4, name: "Quarterly Review", targetDate: "~ Dec 2026", score: 4.2, status: "UPCOMING", notes: "Target post-remediation review." },
      { checkpointNumber: 5, name: "Program Closure", targetDate: "~ Feb 2027", score: 4.5, status: "UPCOMING", notes: "Target final realization sign-off." }
    ],
    outcomes: {
      folderCount: { baseline: 541, current: 44, percentChange: -91.9 },
      duplicateFiles: { baseline: 117, current: 49, percentChange: -58.1 },
      genericNames: { baseline: 347, current: 41, percentChange: -88.2 },
      everyoneGrants: 0,
      folderExceptions: 0,
      trainedStaff: 1151,
      totalStaff: 1151,
      activeFiles: 227
    },
    needsAttention: [
      {
        id: "NA-1",
        category: "SECURITY (M365)",
        severity: "Critical",
        healthStatus: "Weak",
        title: "Records & Security Labelling",
        issue: "Security health: Weak — 0% retention labels applied; 205 potentially sensitive files unlabelled.",
        impact: "Leaves confidential student and administrative records unclassified in SharePoint, risking compliance breach under BC FIPPA.",
        recommendation: "Configure Microsoft Purview auto-labelling rules and security classifications across all PRM document libraries.",
        score: 45
      },
      {
        id: "NA-2",
        category: "HYGIENE",
        severity: "Medium",
        healthStatus: "At Risk",
        title: "Version-Control Maturity & OneDrive Sync Friction",
        issue: "Version-control maturity — 'v2/final/draft' filename habits increasing (468 ➔ 607 files); Site Owner noted friction syncing OneDrive with SP site resulting in manual uploads.",
        impact: "Staff creating redundant file versions rather than utilizing built-in M365 version history, cluttering document search and slowing collaboration.",
        recommendation: "Conduct targeted OCM coaching clinics on OneDrive sync vs. manual uploads and M365 co-authoring practice sessions (Due: Gate 2 +30d).",
        score: 60
      }
    ],
    scorecard: [
      { driverId: "B1", name: "Improved Collaboration & Productivity", score: 4.2, target: 5.0, status: "On Track", evidence: "4.5/5 version control survey, 40.2% ROT reduction (2,175 ➔ 1,300 files)." },
      { driverId: "B2", name: "Enhanced Data Security & Compliance", score: 3.8, target: 5.0, status: "Monitor", evidence: "4.5/5 restricted access confidence, 0 'Everyone' grants; 0% retention labels (205 files unlabelled)." },
      { driverId: "B3", name: "Simplified IT Management", score: 4.0, target: 5.0, status: "On Track", evidence: "4.5/5 support awareness, 15.1% storage reduction (3.90 ➔ 3.31 GB), 0 path length errors." },
      { driverId: "B4", name: "Enable Remote Work & Mobility", score: 3.6, target: 5.0, status: "Monitor", evidence: "3.5/5 off-site work ease; OneDrive sync coaching required to replace manual uploads." },
      { driverId: "B5", name: "Improved Decision-Making & BI", score: 4.1, target: 5.0, status: "On Track", evidence: "Folder depth collapsed 8 ➔ 2 (-75%), 541 ➔ 44 folders (-91.9%), metadata navigation active." },
      { driverId: "B6", name: "Streamlined Processes", score: 3.7, target: 5.0, status: "Progressing", evidence: "4.0/5 collaboration ease; workflow transition underway across PRM libraries." },
      { driverId: "B7", name: "Standardization", score: 3.5, target: 5.0, status: "On Track", evidence: "5.0/5 metadata confidence; generic filenames reduced 347 ➔ 41 (-88.2%)." },
      { driverId: "B8", name: "Improved Adoption", score: 4.5, target: 5.0, status: "On Track", evidence: "4.5/5 training satisfaction, 4.5/5 team responsiveness, 100% staff trained (1,151 staff)." },
      { driverId: "B9", name: "Cost Savings", score: 3.9, target: 5.0, status: "Verified", evidence: "15.1% storage reduction (3.90 ➔ 3.31 GB); >$70k PBX savings; $280k storage avoidance." }
    ],
    stakeholders: [
      { name: "Suzanna de Souza", role: "Organizational Change Manager & SuperAdmin", email: "sdesouza@langara.ca" },
      { name: "Shireen Cardas", role: "Associate Director IT PPM", email: "scardas@langara.ca" },
      { name: "PRM Business Unit Lead", role: "Business Unit Lead & Executive Sponsor", email: "prm-lead@langara.ca" }
    ],
    strategicAlignmentStatement:
      "Advances Langara's Digital Roadmap by modernizing information management, strengthening collaboration, and enabling a more secure, compliant, and efficient service environment.",
    coachingTips: [
      {
        title: "Hold the 'White Space'",
        tip: "To move from reactive firefighting to proactive transformation, protect 20% of your calendar for future-state governance planning."
      },
      {
        title: "Address 'Causing Friction'",
        tip: "When someone resists adopting automated versioning, explore the why. Bridge the gap between 'how we've always named files' and 'co-authoring in M365'."
      }
    ],
    alignmentStatus: {
      seniorLeaderScore: 83,
      managerScore: 78,
      employeeScore: 80,
      largestGap: "SENIOR LEADER VS MANAGER (+5)",
      statusBadge: "HIGH ALIGNMENT",
      narrative: "Low variance detected, the organization is moving with aligned execution."
    }
  }
];

const seed = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("Connected to MongoDB successfully");

    for (const record of seedData) {
      const updated = await BenefitsRealization.findOneAndUpdate(
        { orgName: record.orgName, programName: record.programName },
        record,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`[SEED] Upserted Benefits Realization for ${updated.orgName} (${updated.programName})`);
    }

    const count = await BenefitsRealization.countDocuments();
    console.log(`[SEED] Completed. Total Benefits Realization records in DB: ${count}`);

    process.exit(0);
  } catch (err) {
    console.error("[SEED ERROR]", err);
    process.exit(1);
  }
};

seed();
