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
      required: true,
      default: null
    },

    adminId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    firstName: {
      type: String,
      required: true
    },

    lastName: {
      type: String,
      required: true
    },

    department: {
      type: String,
      required: true
    },

    titles: {
      type: String
    },

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
    { userId: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
};

export default mongoose.model("User", userSchema);
