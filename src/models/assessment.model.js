import mongoose, { Schema } from "mongoose";

const assessmentSchema = new Schema({
  stakeholder: {
    type: String,
    required: true
  },

  userId: {
    type: Schema.Types.ObjectId,
    ref: "User"
  },

  employeeEmail: {
    type: String
  },

  invitedBy: {
    type: Schema.Types.ObjectId,
    ref: "User"
  },

  orgName: {
    type: String
  },

  invitationId: {
    type: Schema.Types.ObjectId,
    ref: "Invitation",
    required: true,
    unique: true
  },
  
  // person snapshot
  userDetails: {
    type: Object,
    default: null
  },

  isCompleted: {
    type: Boolean,
    default: false
  },

  submittedAt: {
    type: Date
  },

  responses: [
    {
      questionId: {
        type: Schema.Types.ObjectId,
        ref: "Question"
      },
      questionCode: String,
      answer: Schema.Types.Mixed,
      comment: String
    }
  ]
});

export default mongoose.model("Assessment", assessmentSchema);
