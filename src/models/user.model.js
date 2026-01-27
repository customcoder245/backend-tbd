import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: true,
      minlength: 8
    },

    role: {
      type: String,
      enum: ["superAdmin", "admin", "leader", "manager", "employee"],
      required: false,
      default: null
    },

    orgName: {
      type: String,
      required: false,
      unique: false,
      default: null
    },

    adminId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    firstName: {
      type: String,
      required: false
    },

    lastName: {
      type: String,
      required: false
    },

    department: {
      type: String,
      required: false
    },

    titles: {
      type: String
    },
    
    invitationToken: { type: String },

    profileCompleted: {
      type: Boolean,
      default: false
    },

    // isApprovedByAdmin: {
    //   type: Boolean,
    //   default: false
    // },

    // approvedBy: {
    //   type: Schema.Types.ObjectId,
    //   ref: "User",
    //   default: null
    // },

    isEmailVerified: {
      type: Boolean,
      default: false
    },

    emailVerificationToken: String,
    emailVerificationExpires: Date,

    resetPasswordToken: String,
    resetPasswordExpires: Date
  },
  { timestamps: true }
);

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    { userId: this._id, role: this.role , orgName: this.orgName},
    process.env.JWT_SECRET,
    { expiresIn: "60m" }
  );
};

export default mongoose.model("User", userSchema);
