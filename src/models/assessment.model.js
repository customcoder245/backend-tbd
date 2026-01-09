import mongoose, { Schema } from "mongoose";

const assessmentSchema = new mongoose.Schema({
  stakeholder: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  submittedAt: {
    type: Date
  },
  responses: [{
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question" },
    questionCode: String,
    answer: mongoose.Schema.Types.Mixed,
    comment: String
  }]
});

export default mongoose.model("Assessment", assessmentSchema);
