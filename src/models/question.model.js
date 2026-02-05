import mongoose, { Schema } from "mongoose";
import { ROLE_DOMAIN_SUBDOMAINS } from "../constants/roleDomainSubdomains.js";

// Define the question schema
const questionSchema = new Schema(
  {
    stakeholder: {
      type: String,
      enum: ["leader", "manager", "employee", "admin"],
      required: true
    },

    domain: {
      type: String,
      enum: ["People Potential", "Operational Steadiness", "Digital Fluency"],
      required: true
    },

    subdomain: {
      type: String,
      required: true,
      validate: {
        validator: function (value) {
          return ROLE_DOMAIN_SUBDOMAINS[this.stakeholder]?.[this.domain]?.includes(value);
        },
        message: "Invalid subdomain for selected stakeholder and domain"
      }
    },

    questionType: {
      type: String,
      enum: ["Self-Rating", "Calibration", "Behavioural", "Forced-Choice"],
      required: true
    },

    questionCode: {
      type: String,
      unique: true,
      required: true
    },

    questionStem: {
      type: String,
      required: true
    },

    scale: {
      type: String,
      enum: ["SCALE_1_5", "NEVER_ALWAYS", "FORCED_CHOICE"],
      required: true
    },

    insightPrompt: {
      type: String
    },

    forcedChoice: {
      optionA: {
        label: String,
        insightPrompt: String
      },
      optionB: {
        label: String,
        insightPrompt: String
      },
      higherValueOption: {
        type: String,
        enum: ["A", "B"]
      }
    },

    isDeleted: {
      type: Boolean,
      default: false
    },

    subdomainWeight: {
      type: Number,
      required: true
    }
  },
  { timestamps: true }
);

export default mongoose.model("Question", questionSchema);
