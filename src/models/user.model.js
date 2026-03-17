

import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [ /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Invalid Email address" ],
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
      trim: true
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

    middleInitial: {
      type: String,
      required: false
    },

    lastName: {
      type: String,
      required: false
    },

    dob: {
      type: Date,
      required: false
    },

    gender: {
      type: String,
      required: false
    },

    phoneNumber: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
      trim: true
    },

    country: {
      type: String,
      required: false,
      trim: true
    },

    state: {
      type: String,
      required: false,
      trim: true
    },

    zipCode: {
      type: String,
      required: false,
      trim: true
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

    profileCompletedAfterRegistration: {
      type: Boolean,
      default: false
    },

    profileImage: {
      type: String,
      required: false
    },

    orgLogo: {
      type: String,
      required: false
    },

    isEmailVerified: {
      type: Boolean,
      default: false
    },

    emailVerificationToken: String,
    emailVerificationExpires: Date,

    resetPasswordToken: String,
    resetPasswordExpires: Date,

    // Assessment scores snapshot
    lastAssessmentScore: {
      type: Number,
      default: 0
    },
    lastAssessmentClassification: {
      type: String,
      enum: ["Low", "Medium", "High", null],
      default: null
    },

    notificationPreferences: {
      system: {
        type: Boolean,
        default: true
      },
      email: {
        type: Boolean,
        default: false
      }
    }
  },
  { timestamps: true }
);

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    { userId: this._id, role: this.role, orgName: this.orgName },
    process.env.JWT_SECRET,
    { expiresIn: "3h" }
  );
};

userSchema.index({ invitationToken: 1 });
userSchema.index({ orgName: 1, role: 1 });
userSchema.index({ role: 1 });
userSchema.index({ emailVerificationToken: 1 });
userSchema.index({ resetPasswordToken: 1 });

export default mongoose.model("User", userSchema);
