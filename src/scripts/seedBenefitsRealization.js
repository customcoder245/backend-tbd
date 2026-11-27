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
    activeCheckpointNumber: 2,
    pillars: [
      {
        name: "Delivery",
        status: "On Track",
        score: 4.2,
        summary: "Technical milestones and M365 infrastructure on schedule."
      },
      {
        name: "Adoption",
        status: "On Track",
        score: 4.5,
        summary: "100% staff training completed, 227 active files."
      },
      {
        name: "Benefits",
        status: "Progressing",
        score: 3.9,
        summary: "Early collaboration gains realized; governance behaviors progressing."
      },
      {
        name: "Risk & Compliance",
        status: "Monitor",
        score: 3.2,
        summary: "Purview labels and FIPPA compliance require active remediation."
      }
    ],
    checkpoints: [
      {
        checkpointNumber: 1,
        name: "Baseline",
        targetDate: "June 2026",
        score: 0,
        status: "COMPLETED",
        notes: "Informal."
      },
      {
        checkpointNumber: 2,
        name: "Hypercare / Operational Readiness",
        targetDate: "June 2026",
        score: 3.9,
        status: "ACTIVE",
        notes:
          "Approximately 10 days after go-live. Transition to site owners and Langara IT operations."
      },
      {
        checkpointNumber: 3,
        name: "90 Days After Op Handover",
        targetDate: "Nov 2026",
        score: 0,
        status: "UPCOMING",
        notes: "Informal check-in (OCM)."
      },
      {
        checkpointNumber: 4,
        name: "9-12 Month Post Go-Live",
        targetDate: "~ TBD",
        score: 0,
        status: "UPCOMING",
        notes:
          "Approximately 1 year after go-live. Pulse site health and identify skills and training gaps for site owners."
      },
      {
        checkpointNumber: 5,
        name: "Program Closure",
        targetDate: "~ TBD",
        score: 0,
        status: "UPCOMING",
        notes: "Transition to sustained operations & continuous governance."
      }
    ],
    outcomes: {
      folderCount: { baseline: 541, current: 44, percentChange: -91.9 },
      duplicateFiles: { baseline: 117, current: 49, percentChange: -58.1 },
      genericNames: { baseline: 347, current: 41, percentChange: -88.2 },
      everyoneGrants: 0,
      folderExceptions: 0,
      trainedStaff: 2,
      totalStaff: 2,
      activeFiles: 227
    },
    needsAttention: [
      {
        id: "NA-1",
        category: "SECURITY (M365)",
        severity: "Critical",
        healthStatus: "Weak",
        title: "Records & Security Labelling",
        issue:
          "0% retention labels applied. 205 potentially sensitive administrative and student files remain unlabeled in SharePoint document libraries.",
        impact:
          "Leaves confidential records unclassified in SharePoint, risking compliance breach under BC Freedom of Information and Protection of Privacy Act (FIPPA).",
        recommendation:
          "LCP Project 1 is piloting Purview auto-labelling and security classifications across selected PRM libraries using retain-only labels, with no automated deletion or disposition. Retention schedules are being gathered through the LCP program requirements.",
        score: 45
      },
      {
        id: "NA-2",
        category: "HYGIENE",
        severity: "Medium",
        healthStatus: "At Risk",
        title: "Version-Control Maturity",
        issue:
          "Files with 'v2/final/draft' habits increased (468 ➔ 607). PRM Site Owner feedback: 'I still need to learn how to sync my OneDrive with our SP site so I don't need to manually upload documents.'",
        impact:
          "Generates unnecessary document sprawl, storage overhead, and confusion over which copy represents the authorized single source of truth.",
        recommendation:
          "Deliver targeted 15-minute coaching clinics on OneDrive sync vs. manual uploads.",
        score: 60
      }
    ],
    scorecard: [
      {
        driverId: "B1",
        name: "Improved Collaboration & Productivity",
        score: 4.2,
        target: 5.0,
        status: "On Track",
        strategicPriority: "Human Capacity",
        measurableKpis:
          "Employee-rated collaboration effectiveness (1–5) • Reduction in duplicate copies • Evidence of shared-file collaboration",
        evidence:
          "227 active cloud files; 4.5/5 version control survey, 40.2% ROT reduction (2,175 ➔ 1,300 files)."
      },
      {
        driverId: "B2",
        name: "Enhanced Data Security & Compliance",
        score: 3.8,
        target: 5.0,
        status: "Monitor",
        strategicPriority: "Technology Utilization",
        measurableKpis:
          "% of assessed sites passing access/retention review; excess-grant exceptions; label coverage • Remediation of material security breaches",
        evidence:
          "4.5/5 restricted access confidence; 0 'Everyone' grants; 0% Purview labels (205 files unlabelled)."
      },
      {
        driverId: "B3",
        name: "Simplified IT Management",
        score: 4.0,
        target: 5.0,
        status: "On Track",
        strategicPriority: "Campus Development",
        measurableKpis:
          "Little to no legacy-drive dependence • Reduced recurring file/access tickets • Confirmed operational ownership and site owner training",
        evidence:
          "4.5/5 support awareness; 15.1% storage reduction (3.90 ➔ 3.31 GB); 0 path length errors."
      },
      {
        driverId: "B4",
        name: "Enable Remote Work & Mobility",
        score: 3.6,
        target: 5.0,
        status: "Monitor",
        strategicPriority: "Human Capacity",
        measurableKpis: "Hybrid/remote-work confidence score (1–5)",
        evidence:
          "3.5/5 off-site work ease; OneDrive sync coaching required to replace manual file uploads."
      },
      {
        driverId: "B5",
        name: "Improved Decision-Making & BI",
        score: 4.1,
        target: 5.0,
        status: "On Track",
        strategicPriority: "Technology Utilization",
        measurableKpis:
          "File-findability score (1–5) • Representative document-retrieval tasks and time to locate",
        evidence:
          "Single source of truth; folder depth 8 ➔ 2 (-75%), folders 541 ➔ 44 (-91.9%), duplicate files -58.1%."
      },
      {
        driverId: "B6",
        name: "Streamlined Processes",
        score: 3.7,
        target: 5.0,
        status: "Progressing",
        strategicPriority: "Human Capacity",
        measurableKpis:
          "Staff-confirmed reduced rework and time to locate, collaborate on and share files",
        evidence: "4.0/5 collaboration ease; workflow transition underway across PRM libraries."
      },
      {
        driverId: "B7",
        name: "Standardization",
        score: 3.5,
        target: 5.0,
        status: "On Track",
        strategicPriority: "Technology Utilization",
        measurableKpis:
          "% of assessed sites meeting approved IA/metadata conventions • Non-compliant naming/path findings fixed • User-rated metadata usefulness",
        evidence: "5.0/5 metadata confidence; generic filenames reduced 347 ➔ 41 (-88.2%)."
      },
      {
        driverId: "B8",
        name: "Improved Adoption",
        score: 4.5,
        target: 5.0,
        status: "On Track",
        strategicPriority: "Human Capacity",
        measurableKpis:
          "% of target users active in approved workspaces • Storage-choice knowledge check • Secure and consistent sharing",
        evidence:
          "4.5/5 training satisfaction, 4.5/5 team responsiveness; 100% staff training completion (2/2 PRM staff)."
      },
      {
        driverId: "B9",
        name: "Cost Savings",
        score: 3.9,
        target: 5.0,
        status: "Dollar Savings Not Quantified",
        strategicPriority: "Campus Development",
        measurableKpis:
          "Annual legacy storage/infrastructure/support savings ($) • Net of ongoing costs • Retirement evidence",
        evidence: "15.1% storage reduction (3.90 ➔ 3.31 GB)"
      }
    ],
    programRollup: {
      reportingDate: "November 27, 2026",
      programManager: "Seynabou Diack",
      programSponsor: "Justin Yau",
      startDate: "Apr 1, 2025",
      endDate: "Jan 31, 2028",
      projectProgress: "1 of 7",
      newSitesInOperation: "5 of 9 in Project 1",
      approxTeamsRemaining: 20,
      budget: [
        {
          fundType: "Operating (FY27)",
          baseline: "$9,352",
          ytd: "$7,862",
          etc: "$1,490",
          eac: "$9,352",
          variance: "0%"
        },
        {
          fundType: "Capital (FY27)",
          baseline: "$1,481,566",
          ytd: "$604,571",
          etc: "$763,194",
          eac: "$1,367,765",
          variance: "8%"
        },
        {
          fundType: "TOTAL",
          baseline: "$1,490,918",
          ytd: "$612,433",
          etc: "$764,684",
          eac: "$1,377,117",
          variance: "8%"
        }
      ],
      strategicPriorities: [
        {
          priority: "Human Capacity",
          totalScore: 16.0,
          maxScore: 20.0,
          averageScore: 4.0,
          benefitCount: 4,
          driverIds: ["B1", "B4", "B6", "B8"]
        },
        {
          priority: "Technology Utilization",
          totalScore: 11.4,
          maxScore: 15.0,
          averageScore: 3.8,
          benefitCount: 3,
          driverIds: ["B2", "B5", "B7"]
        },
        {
          priority: "Campus Development",
          totalScore: 7.9,
          maxScore: 10.0,
          averageScore: 4.0,
          benefitCount: 2,
          driverIds: ["B3", "B9"]
        }
      ]
    },
    stakeholders: [
      {
        name: "Suzanna de Souza",
        role: "Organizational Change Manager & SuperAdmin",
        email: "sdesouza@langara.ca"
      },
      { name: "Shireen Cardas", role: "Associate Director IT PPM", email: "scardas@langara.ca" },
      {
        name: "PRM Business Unit Lead",
        role: "Business Unit Lead & Executive Sponsor",
        email: "prm-lead@langara.ca"
      }
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
    activeCheckpointNumber: 2,
    pillars: [
      {
        name: "Delivery",
        status: "On Track",
        score: 4.2,
        summary: "Technical milestones and M365 infrastructure on schedule."
      },
      {
        name: "Adoption",
        status: "On Track",
        score: 4.5,
        summary: "100% staff training completed, 227 active files."
      },
      {
        name: "Benefits",
        status: "Progressing",
        score: 3.9,
        summary: "Early collaboration gains realized; governance behaviors progressing."
      },
      {
        name: "Risk & Compliance",
        status: "Monitor",
        score: 3.2,
        summary: "Purview labels and FIPPA compliance require active remediation."
      }
    ],
    checkpoints: [
      {
        checkpointNumber: 1,
        name: "Baseline",
        targetDate: "June 2026",
        score: 0,
        status: "COMPLETED",
        notes: "Informal."
      },
      {
        checkpointNumber: 2,
        name: "Hypercare / Operational Readiness",
        targetDate: "June 2026",
        score: 3.9,
        status: "ACTIVE",
        notes:
          "Approximately 10 days after go-live. Transition to site owners and Langara IT operations."
      },
      {
        checkpointNumber: 3,
        name: "90 Days After Op Handover",
        targetDate: "Nov 2026",
        score: 0,
        status: "UPCOMING",
        notes: "Informal check-in (OCM)."
      },
      {
        checkpointNumber: 4,
        name: "9-12 Month Post Go-Live",
        targetDate: "~ TBD",
        score: 0,
        status: "UPCOMING",
        notes:
          "Approximately 1 year after go-live. Pulse site health and identify skills and training gaps for site owners."
      },
      {
        checkpointNumber: 5,
        name: "Program Closure",
        targetDate: "~ TBD",
        score: 0,
        status: "UPCOMING",
        notes: "Transition to sustained operations & continuous governance."
      }
    ],
    outcomes: {
      folderCount: { baseline: 541, current: 44, percentChange: -91.9 },
      duplicateFiles: { baseline: 117, current: 49, percentChange: -58.1 },
      genericNames: { baseline: 347, current: 41, percentChange: -88.2 },
      everyoneGrants: 0,
      folderExceptions: 0,
      trainedStaff: 2,
      totalStaff: 2,
      activeFiles: 227
    },
    needsAttention: [
      {
        id: "NA-1",
        category: "SECURITY (M365)",
        severity: "Critical",
        healthStatus: "Weak",
        title: "Records & Security Labelling",
        issue:
          "0% retention labels applied. 205 potentially sensitive administrative and student files remain unlabeled in SharePoint document libraries.",
        impact:
          "Leaves confidential records unclassified in SharePoint, risking compliance breach under BC Freedom of Information and Protection of Privacy Act (FIPPA).",
        recommendation:
          "LCP Project 1 is piloting Purview auto-labelling and security classifications across selected PRM libraries using retain-only labels, with no automated deletion or disposition. Retention schedules are being gathered through the LCP program requirements.",
        score: 45
      },
      {
        id: "NA-2",
        category: "HYGIENE",
        severity: "Medium",
        healthStatus: "At Risk",
        title: "Version-Control Maturity",
        issue:
          "Files with 'v2/final/draft' habits increased (468 ➔ 607). PRM Site Owner feedback: 'I still need to learn how to sync my OneDrive with our SP site so I don't need to manually upload documents.'",
        impact:
          "Generates unnecessary document sprawl, storage overhead, and confusion over which copy represents the authorized single source of truth.",
        recommendation:
          "Deliver targeted 15-minute coaching clinics on OneDrive sync vs. manual uploads.",
        score: 60
      }
    ],
    scorecard: [
      {
        driverId: "B1",
        name: "Improved Collaboration & Productivity",
        score: 4.2,
        target: 5.0,
        status: "On Track",
        strategicPriority: "Human Capacity",
        measurableKpis:
          "Employee-rated collaboration effectiveness (1–5) • Reduction in duplicate copies • Evidence of shared-file collaboration",
        evidence:
          "227 active cloud files; 4.5/5 version control survey, 40.2% ROT reduction (2,175 ➔ 1,300 files)."
      },
      {
        driverId: "B2",
        name: "Enhanced Data Security & Compliance",
        score: 3.8,
        target: 5.0,
        status: "Monitor",
        strategicPriority: "Technology Utilization",
        measurableKpis:
          "% of assessed sites passing access/retention review; excess-grant exceptions; label coverage • Remediation of material security breaches",
        evidence:
          "4.5/5 restricted access confidence; 0 'Everyone' grants; 0% Purview labels (205 files unlabelled)."
      },
      {
        driverId: "B3",
        name: "Simplified IT Management",
        score: 4.0,
        target: 5.0,
        status: "On Track",
        strategicPriority: "Campus Development",
        measurableKpis:
          "Little to no legacy-drive dependence • Reduced recurring file/access tickets • Confirmed operational ownership and site owner training",
        evidence:
          "4.5/5 support awareness; 15.1% storage reduction (3.90 ➔ 3.31 GB); 0 path length errors."
      },
      {
        driverId: "B4",
        name: "Enable Remote Work & Mobility",
        score: 3.6,
        target: 5.0,
        status: "Monitor",
        strategicPriority: "Human Capacity",
        measurableKpis: "Hybrid/remote-work confidence score (1–5)",
        evidence:
          "3.5/5 off-site work ease; OneDrive sync coaching required to replace manual file uploads."
      },
      {
        driverId: "B5",
        name: "Improved Decision-Making & BI",
        score: 4.1,
        target: 5.0,
        status: "On Track",
        strategicPriority: "Technology Utilization",
        measurableKpis:
          "File-findability score (1–5) • Representative document-retrieval tasks and time to locate",
        evidence:
          "Single source of truth; folder depth 8 ➔ 2 (-75%), folders 541 ➔ 44 (-91.9%), duplicate files -58.1%."
      },
      {
        driverId: "B6",
        name: "Streamlined Processes",
        score: 3.7,
        target: 5.0,
        status: "Progressing",
        strategicPriority: "Human Capacity",
        measurableKpis:
          "Staff-confirmed reduced rework and time to locate, collaborate on and share files",
        evidence: "4.0/5 collaboration ease; workflow transition underway across PRM libraries."
      },
      {
        driverId: "B7",
        name: "Standardization",
        score: 3.5,
        target: 5.0,
        status: "On Track",
        strategicPriority: "Technology Utilization",
        measurableKpis:
          "% of assessed sites meeting approved IA/metadata conventions • Non-compliant naming/path findings fixed • User-rated metadata usefulness",
        evidence: "5.0/5 metadata confidence; generic filenames reduced 347 ➔ 41 (-88.2%)."
      },
      {
        driverId: "B8",
        name: "Improved Adoption",
        score: 4.5,
        target: 5.0,
        status: "On Track",
        strategicPriority: "Human Capacity",
        measurableKpis:
          "% of target users active in approved workspaces • Storage-choice knowledge check • Secure and consistent sharing",
        evidence:
          "4.5/5 training satisfaction, 4.5/5 team responsiveness; 100% staff training completion (2/2 PRM staff)."
      },
      {
        driverId: "B9",
        name: "Cost Savings",
        score: 3.9,
        target: 5.0,
        status: "Dollar Savings Not Quantified",
        strategicPriority: "Campus Development",
        measurableKpis:
          "Annual legacy storage/infrastructure/support savings ($) • Net of ongoing costs • Retirement evidence",
        evidence: "15.1% storage reduction (3.90 ➔ 3.31 GB)"
      }
    ],
    programRollup: {
      reportingDate: "November 27, 2026",
      programManager: "Seynabou Diack",
      programSponsor: "Justin Yau",
      startDate: "Apr 1, 2025",
      endDate: "Jan 31, 2028",
      projectProgress: "1 of 7",
      newSitesInOperation: "5 of 9 in Project 1",
      approxTeamsRemaining: 20,
      budget: [
        {
          fundType: "Operating (FY27)",
          baseline: "$9,352",
          ytd: "$7,862",
          etc: "$1,490",
          eac: "$9,352",
          variance: "0%"
        },
        {
          fundType: "Capital (FY27)",
          baseline: "$1,481,566",
          ytd: "$604,571",
          etc: "$763,194",
          eac: "$1,367,765",
          variance: "8%"
        },
        {
          fundType: "TOTAL",
          baseline: "$1,490,918",
          ytd: "$612,433",
          etc: "$764,684",
          eac: "$1,377,117",
          variance: "8%"
        }
      ],
      strategicPriorities: [
        {
          priority: "Human Capacity",
          totalScore: 16.0,
          maxScore: 20.0,
          averageScore: 4.0,
          benefitCount: 4,
          driverIds: ["B1", "B4", "B6", "B8"]
        },
        {
          priority: "Technology Utilization",
          totalScore: 11.4,
          maxScore: 15.0,
          averageScore: 3.8,
          benefitCount: 3,
          driverIds: ["B2", "B5", "B7"]
        },
        {
          priority: "Campus Development",
          totalScore: 7.9,
          maxScore: 10.0,
          averageScore: 4.0,
          benefitCount: 2,
          driverIds: ["B3", "B9"]
        }
      ]
    },
    stakeholders: [
      {
        name: "Suzanna de Souza",
        role: "Organizational Change Manager & SuperAdmin",
        email: "sdesouza@langara.ca"
      },
      { name: "Shireen Cardas", role: "Associate Director IT PPM", email: "scardas@langara.ca" },
      {
        name: "PRM Business Unit Lead",
        role: "Business Unit Lead & Executive Sponsor",
        email: "prm-lead@langara.ca"
      }
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
      console.log(
        `[SEED] Upserted Benefits Realization for ${updated.orgName} (${updated.programName})`
      );
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
