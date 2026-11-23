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
      enum: ["On Track", "Monitor", "Progressing", "Verified"],
      default: "On Track"
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
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model("BenefitsRealization", benefitsRealizationSchema);
