import mongoose, { Schema } from "mongoose";

const submittedAssessmentSchema = new Schema(
  {
    assessmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assessment",
      required: true
    },

    stakeholder: String,

    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    userDetails: {
      type: Object
    },

    responses: {
      type: [Object], // FULL response objects
      required: true
    },

    scores: {
      overall: { type: Number, default: 0 },
      domains: {
        type: Schema.Types.Mixed,
        default: {}
      }
    },

    classification: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Low"
    },

    submittedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

submittedAssessmentSchema.index({ assessmentId: 1 });
submittedAssessmentSchema.index({ userId: 1 });
submittedAssessmentSchema.index({ adminId: 1 });
submittedAssessmentSchema.index({ submittedAt: -1 });

export default mongoose.model("SubmittedAssessment", submittedAssessmentSchema);
