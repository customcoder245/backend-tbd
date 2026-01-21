import mongoose, {Schema} from "mongoose";

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

    submittedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

export default mongoose.model("SubmittedAssessment", submittedAssessmentSchema);
