import mongoose, { Schema } from "mongoose";

const responseSchema = new Schema(
  {
    assessmentId: {
      type: Schema.Types.ObjectId,
      ref: "Assessment",
      required: true
    },

    questionId: {
      type: Schema.Types.ObjectId,
      ref: "Question",
      required: true
    },

    questionCode: {
      type: String,
      required: true
    },

    questionStem: {
      type: String,
      required: true
    },

    stakeholder: {
      type: String,
      enum: ["leader", "manager", "employee"],
      required: true
    },

    domain: {
      type: String,
      enum: ["People Potential", "Operational Steadiness", "Digital Fluency"],
      required: true
    },

    subdomain: {
      type: String,
      required: true
    },

    questionType: {
      type: String,
      enum: ["Self-Rating", "Calibration", "Behavioural", "Forced-Choice"],
      required: true
    },

    scale: {
      type: String,
      enum: ["SCALE_1_5", "NEVER_ALWAYS", "FORCED_CHOICE"],
      required: true
    },

    value: { 
      type: Number 
    },

    selectedOption: {
      type: String,
      enum: ["A", "B"]
    },

    higherValueOption: {
      type: String,
      enum: ["A", "B"]
    },

    valueDirection: {
      type: String,
      enum: ["HIGHER", "LOWER"]
    },

    comment: {
      type: String,
      default: null
    },

    subdomainWeight: {
      type: Number,
      required: true, 
      min: 0
    }
  },
  { timestamps: true }
);

export default mongoose.model("Response", responseSchema);
