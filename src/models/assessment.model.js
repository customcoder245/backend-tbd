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
    required: false
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
  ],

  scores: {
    overall: { type: Number, default: 0 },
    domains: {
      type: Map,
      of: {
        score: Number,
        feedback: { type: Object, default: null },
        subdomains: {
          type: Map,
          of: Number
        }
      }
    }
  },

  classification: {
    type: String,
    enum: ["Low", "Medium", "High"],
    default: "Low"
  }
}, { timestamps: true });

export default mongoose.model("Assessment", assessmentSchema);
