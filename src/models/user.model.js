import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
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
      trim: true
    },

    adminId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    firstName: {
      type: String,
      required: [true, "First name is required"]

    },

    middleInitial: {
      type: String,
      required: false
    },

    lastName: {
      type: String,
      required: [true, "Last name is required"]

    },

    dob: {
      type: Date,
      required: [true, "Date of birth is required"]

    },

    gender: {
      type: String,
      required: false
    },

    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],

      unique: true,
      sparse: true,
      trim: true
    },

    country: {
      type: String,
      required: [true, "Country is required"],

      trim: true
    },

    state: {
      type: String,
      required: [true, "State is required"],

      trim: true
    },

    zipCode: {
      type: String,
      required: [true, "Zip code is required"],

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

    isEmailVerified: {
      type: Boolean,
      default: false
    },

    emailVerificationToken: String,
    emailVerificationExpires: Date,

    resetPasswordToken: String,
    resetPasswordExpires: Date,

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
    { expiresIn: "60m" }
  );
};

export default mongoose.model("User", userSchema);
