import mongoose, { Schema } from "mongoose";

const checkpointSchema = new Schema(
  {
    checkpointNumber: { type: Number, required: true }, // 1 to 5
    name: { type: String, required: true }, // "Baseline", "3-Month Review", "90-Day Review", etc.
    targetDate: { type: String, required: true }, // "Nov 2024", "Nov 2026", etc.
    score: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["COMPLETED", "ACTIVE", "UPCOMING"],
      default: "UPCOMING"
    },
    notes: { type: String, default: "" }
  },
  { _id: false }
);

const pillarSchema = new Schema(
  {
    name: { type: String, required: true }, // "Delivery", "Adoption", "Benefits", "Risk & Security"
    status: {
      type: String,
      enum: ["On Track", "Progressing", "Monitor", "At Risk"],
      default: "On Track"
    },
    score: { type: Number, default: 0 },
    summary: { type: String, default: "" }
  },
  { _id: false }
);

const needsAttentionSchema = new Schema(
  {
    id: { type: String, required: true },
    category: { type: String, default: "SECURITY (M365)" },
    severity: {
      type: String,
      enum: ["Critical", "High", "Medium", "Low"],
      default: "Medium"
    },
    healthStatus: { type: String, default: "Weak" },
    title: { type: String, required: true },
    issue: { type: String, required: true },
    impact: { type: String, required: true },
    recommendation: { type: String, required: true },
    score: { type: Number, default: 0 }
  },
  { _id: false }
);

const scorecardDriverSchema = new Schema(
  {
    driverId: { type: String, required: true }, // "B1" to "B9"
    name: { type: String, required: true }, // "Improved Collaboration"
    score: { type: Number, required: true, default: 0 },
    target: { type: Number, default: 5.0 },
    status: {
      type: String,
      enum: ["On Track", "Monitor", "Progressing", "Verified", "Dollar Savings Not Quantified", "Needs Attention"],
      default: "On Track"
    },
    strategicPriority: {
      type: String,
      default: "Human Capacity"
    },
    measurableKpis: {
      type: String,
      default: ""
    },
    evidence: { type: String, default: "" }
  },
  { _id: false }
);

const outcomesSchema = new Schema(
  {
    folderCount: {
      baseline: { type: Number, default: 541 },
      current: { type: Number, default: 44 },
      percentChange: { type: Number, default: -91.9 }
    },
    duplicateFiles: {
      baseline: { type: Number, default: 117 },
      current: { type: Number, default: 49 },
      percentChange: { type: Number, default: -58.1 }
    },
    genericNames: {
      baseline: { type: Number, default: 347 },
      current: { type: Number, default: 41 },
      percentChange: { type: Number, default: -88.2 }
    },
    everyoneGrants: { type: Number, default: 0 },
    folderExceptions: { type: Number, default: 0 },
    trainedStaff: { type: Number, default: 1151 },
    totalStaff: { type: Number, default: 1151 },
    activeFiles: { type: Number, default: 227 }
  },
  { _id: false }
);

const stakeholderSchema = new Schema(
  {
    name: { type: String, required: true },
    role: { type: String, required: true },
    email: { type: String, default: "" }
  },
  { _id: false }
);

const scoreDefinitionSchema = new Schema(
  {
    level: { type: Number, required: true }, // 1 to 5
    label: { type: String, required: true },
    description: { type: String, required: true },
    color: { type: String, default: "#6D6E70" }
  },
  { _id: false }
);

const thresholdSchema = new Schema(
  {
    key: { type: String, required: true },
    title: { type: String, required: true },
    unit: { type: String, default: "" },
    greenCondition: { type: String, default: ">= 4.0" },
    amberCondition: { type: String, default: "3.5 - 3.9" },
    redCondition: { type: String, default: "< 3.5" },
    greenMin: { type: Number, default: 4.0 },
    amberMin: { type: Number, default: 3.5 },
    currentValue: { type: String, default: "" }
  },
  { _id: false }
);

const ragColorSchema = new Schema(
  {
    status: { type: String, required: true },
    label: { type: String, required: true },
    code: { type: String, required: true },
    meaning: { type: String, required: true }
  },
  { _id: false }
);

const governanceConfigSchema = new Schema(
  {
    scaleMax: { type: Number, default: 5.0 },
    realizationIndexFormula: {
      type: String,
      default: "(Arithmetic Mean Score / Scale Max) * 100%"
    },
    scoringMethodology: [scoreDefinitionSchema],
    thresholds: [thresholdSchema],
    ragColors: [ragColorSchema]
  },
  { _id: false }
);

const benefitsRealizationSchema = new Schema(
  {
    orgName: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    programName: {
      type: String,
      required: true,
      default: "Langara Collaboration Platform (LCP)"
    },
    pid: {
      type: String,
      default: "PID 6738"
    },
    waveName: {
      type: String,
      default: "Admin Group 1 — Privacy & Records Management (PRM)"
    },
    overallScore: {
      type: Number,
      required: true,
      default: 3.9
    },
    targetScore: {
      type: Number,
      default: 5.0
    },
    realizationPercentage: {
      type: Number,
      default: 78
    },
    activeCheckpointNumber: {
      type: Number,
      default: 3
    },
    pillars: [pillarSchema],
    checkpoints: [checkpointSchema],
    outcomes: {
      type: outcomesSchema,
      default: () => ({})
    },
    needsAttention: [needsAttentionSchema],
    scorecard: [scorecardDriverSchema],
    stakeholders: [stakeholderSchema],
    governanceConfig: {
      type: governanceConfigSchema,
      default: () => ({
        scaleMax: 5.0,
        realizationIndexFormula: "(Arithmetic Mean Score / Scale Max) * 100%",
        scoringMethodology: [
          { level: 1, label: "Critical Gap", description: "Not started, severe adoption resistance, or compliance failure (<2.0)", color: "#D9534F" },
          { level: 2, label: "Emerging / Ad-hoc", description: "Early adoption; manual processes persist; user coaching needed (2.0 - 2.9)", color: "#F29705" },
          { level: 3, label: "Established (Floor Met)", description: "Acceptable baseline operating floor; core functions in place (3.0 - 3.4)", color: "#FCB511" },
          { level: 4, label: "Advanced (Target Met)", description: "Target realized; consistent modern habits; strong compliance (3.5 - 4.4)", color: "#1E824C" },
          { level: 5, label: "Optimized / Exceeding", description: "Full institutional maturity; automated policies active; max efficiency (4.5 - 5.0)", color: "#155724" }
        ],
        thresholds: [
          { key: "driverScore", title: "Driver Performance (/5.0)", unit: "score", greenCondition: "Score >= 4.0", amberCondition: "Score 3.5 - 3.9", redCondition: "Score < 3.5", greenMin: 4.0, amberMin: 3.5, currentValue: "3.9 / 5.0 Mean" },
          { key: "surveyMean", title: "Survey Question Mean (/5.0)", unit: "score", greenCondition: "Mean >= 4.0 (Above Target)", amberCondition: "Mean 3.0 - 3.9 (Above Floor)", redCondition: "Mean < 3.0 (Below Floor)", greenMin: 4.0, amberMin: 3.0, currentValue: "4.1 / 5.0 Average" },
          { key: "folderReduction", title: "Folder Architecture Hygiene", unit: "%", greenCondition: "Reduction >= 80%", amberCondition: "Reduction 50% - 79%", redCondition: "Reduction < 50%", greenMin: 80, amberMin: 50, currentValue: "91.9% Reduction" },
          { key: "duplicateReduction", title: "Duplicate File Hygiene", unit: "%", greenCondition: "Reduction >= 50%", amberCondition: "Reduction 25% - 49%", redCondition: "Reduction < 25%", greenMin: 50, amberMin: 25, currentValue: "58.1% Reduction" },
          { key: "sharingGrants", title: "Open Access ('Everyone') Grants", unit: "grants", greenCondition: "0 Grants (Zero Trust)", amberCondition: "1 - 5 Grants with review", redCondition: "> 5 Unapproved Grants", greenMin: 0, amberMin: 1, currentValue: "0 Grants" },
          { key: "staffTraining", title: "Staff Training Enablement", unit: "%", greenCondition: "100% Completed", amberCondition: "80% - 99% Completed", redCondition: "< 80% Completed", greenMin: 100, amberMin: 80, currentValue: "100% Completed" },
          { key: "purviewLabelling", title: "Purview Retention & Labelling", unit: "%", greenCondition: ">= 90% Labelled", amberCondition: "50% - 89% Labelled", redCondition: "< 50% Labelled", greenMin: 90, amberMin: 50, currentValue: "0% Labelled (RED)" }
        ],
        ragColors: [
          { status: "On Track", label: "Green", code: "#1E824C", meaning: "Target met or exceeded; risk is low; no intervention needed." },
          { status: "Monitor / Progressing", label: "Amber", code: "#F29705", meaning: "Acceptable progress toward target; attention required to prevent slippage." },
          { status: "Needs Attention / Critical", label: "Red", code: "#D9534F", meaning: "Below floor; blocking milestone progression; steering escalation required." },
          { status: "Verified", label: "Blue", code: "#468CD2", meaning: "Empirically audited and mathematically verified by financial/technical review." }
        ]
      })
    },
    strategicAlignmentStatement: {
      type: String,
      default:
        "Advances Langara's Digital Roadmap by modernizing information management, strengthening collaboration, and enabling a more secure, compliant, and efficient service environment."
    },
    coachingTips: [
      {
        title: { type: String, default: "" },
        tip: { type: String, default: "" }
      }
    ],
    alignmentStatus: {
      seniorLeaderScore: { type: Number, default: 83 },
      managerScore: { type: Number, default: 78 },
      employeeScore: { type: Number, default: 80 },
      largestGap: { type: String, default: "SENIOR LEADER VS SENIOR LEADER (+0)" },
      statusBadge: { type: String, default: "HIGH ALIGNMENT" },
      narrative: {
        type: String,
        default: "Low variance detected, the organization is moving with aligned execution."
      }
    },
    programRollup: {
      reportingDate: { type: String, default: "November 27, 2026" },
      programManager: { type: String, default: "Seynabou Diack" },
      programSponsor: { type: String, default: "Justin Yau" },
      startDate: { type: String, default: "Apr 1, 2025" },
      endDate: { type: String, default: "Jan 31, 2028" },
      projectProgress: { type: String, default: "1 of 7" },
      newSitesInOperation: { type: String, default: "5 of 9 in Project 1" },
      approxTeamsRemaining: { type: Number, default: 20 },
      budget: [
        {
          fundType: { type: String, default: "Operating (FY27)" },
          baseline: { type: String, default: "$9,352" },
          ytd: { type: String, default: "$7,862" },
          etc: { type: String, default: "$1,490" },
          eac: { type: String, default: "$9,352" },
          variance: { type: String, default: "0%" }
        }
      ],
      strategicPriorities: [
        {
          priority: { type: String, required: true },
          totalScore: { type: Number, default: 0 },
          maxScore: { type: Number, default: 20 },
          averageScore: { type: Number, default: 4.0 },
          benefitCount: { type: Number, default: 4 },
          driverIds: [{ type: String }]
        }
      ]
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model("BenefitsRealization", benefitsRealizationSchema);
