import mongoose, { Schema } from "mongoose";

const invitationSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    role: {
      type: String,
      enum: ["admin", "leader", "manager", "employee"],
      required: true
    },
    token: { type: String, required: true, unique: true },
    token1: { type: String, unique: true },
    orgName: { type: String },
    adminId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    expiredAt: {
      type: Date,
      required: true // Ensure this is always set in your controller
    },
    used: {
      type: Boolean,
      default: false
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.model("Invitation", invitationSchema);