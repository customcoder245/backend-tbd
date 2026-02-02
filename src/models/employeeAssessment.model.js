import mongoose, { Schema } from "mongoose";

const employeeAssessmentSchema = new Schema(
    {
        firstName: {
            type: String,
            required: true
        },
        lastName: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true
        },
        invitationId: {
            type: Schema.Types.ObjectId,
            ref: "Invitation",
        },
        adminId: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        invitedBy: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        token: {
            type: String
        },
        assessmentStartedAt: {
            type: Date
        },
        assessmentCompletedAt: {
            type: Date
        },
        answer: {
            type: Schema.Types.Mixed
        },
        score: {
            type: Number
        },
        status: {
            type: String,
            enum: ['invited', 'started', 'completed', 'reviewed']
        },
        decision: {
            type: String,
            enum: ['pending', 'approved', 'rejected']
        },
        convertedToUser: { type: Boolean, default: false },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
        expiresAt: { type: Date },
        
    }, {
        timestamps: true
    }
)

export default mongoose.model("EmployeeAssessment", employeeAssessmentSchema)