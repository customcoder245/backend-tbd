import mongoose from "mongoose";

const submittedAssessmentSchema = new mongoose.Schema(
  {
    assessmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assessment",
      required: true
    },

    stakeholder: String,

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

    submittedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

export default mongoose.model(
  "SubmittedAssessment",
  submittedAssessmentSchema
);
