# 📚 BACKEND-TBD: COMPLETE LINE-BY-LINE CODE EXPLANATION

**A child-friendly guide to understanding every line of code**

---

## TABLE OF CONTENTS
1. [Database Models](#part-1-database-models)
2. [Controllers (Business Logic)](#part-2-controllers)
3. [Routes (API Endpoints)](#part-3-routes)
4. [Middleware & Utilities](#part-4-middleware)
5. [Complete Flow Example](#part-5-complete-flow)

---

## PART 1: DATABASE MODELS

### USER MODEL - `src/models/user.model.js`

**What it does:** Stores information about people using the system

```javascript
// ====== LINE 3-4: IMPORT TOOLS ======
import mongoose, { Schema } from "mongoose";  // Database connection
import jwt from "jsonwebtoken";              // Security token maker

// ====== LINES 6-158: CREATE USER SCHEMA (Blueprint) ======
const userSchema = new Schema({
  
  // ----- CONTACT INFO SECTION -----
  
  // Lines 8-15: EMAIL
  email: {
    type: String,                    // Text data
    required: [true, "Email is required"],  // Must have this field
    unique: true,                    // No two same emails allowed
    lowercase: true,                 // Convert "USER@EMAIL" to "user@email"
    trim: true,                      // Remove spaces: " user@email " to "user@email"
    match: [/^[a-zA-Z0-9...]+@.../, "Invalid Email address"],  // Check email format
  },
  
  // Lines 17-21: PASSWORD
  password: {
    type: String,                    // Text data
    required: true,                  // MUST have password
    minlength: 8                     // At least 8 characters
  },
  
  // Lines 23-28: USER ROLE (What type of user?)
  role: {
    type: String,
    enum: ["superAdmin", "admin", "leader", "manager", "employee"],  // Only these 5 options
    required: false,                 // Can leave empty at first
    default: null                    // Start with no role
  },
  
  // Lines 30-34: ORGANIZATION NAME
  orgName: {
    type: String,                    // Company/School name
    required: false,                 // Can be empty
    trim: true                       // Remove spaces
  },
  
  // Lines 36-40: WHO IS THE ADMIN?
  adminId: {
    type: Schema.Types.ObjectId,     // Special ID that points to another user
    ref: "User",                     // This ID refers to a User in database
    default: null
  },
  
  // ----- PERSONAL INFO SECTION -----
  
  // Lines 42-55: NAME FIELDS
  firstName: { type: String, required: false },   // First name
  middleInitial: { type: String, required: false },  // M for middle
  lastName: { type: String, required: false },    // Last name
  
  // Line 57-60: BIRTH DATE
  dob: { type: Date, required: false },          // Date of birth
  
  // Line 62-65: GENDER
  gender: { type: String, required: false },     // Male/Female/Other
  
  // Lines 67-73: PHONE NUMBER
  phoneNumber: {
    type: String,
    required: false,
    unique: true,                    // Each person has unique phone or none
    sparse: true,                    // Allows multiple empty values
    trim: true
  },
  
  // Lines 75-91: LOCATION
  country: { type: String, required: false, trim: true },    // USA, India, etc
  state: { type: String, required: false, trim: true },      // CA, NY, etc
  zipCode: { type: String, required: false, trim: true },    // 12345
  
  // Lines 93-96: WORK INFO
  department: { type: String, required: false },  // HR, Sales, IT
  titles: { type: String },                       // Job title
  
  // ----- PROFILE COMPLETION SECTION -----
  
  // Line 102: INVITATION TOKEN
  invitationToken: { type: String },              // Token from invite link
  
  // Lines 104-107: DID THEY FINISH PROFILE?
  profileCompleted: {
    type: Boolean,
    default: false                   // Starts as "not completed"
  },
  
  profileCompletedAfterRegistration: {
    type: Boolean,
    default: false                   // Another flag for tracking
  },
  
  // Lines 114-122: PROFILE PICTURES
  profileImage: { type: String, required: false },    // Link to profile pic
  orgLogo: { type: String, required: false },         // Link to company logo
  
  // ----- EMAIL VERIFICATION SECTION -----
  
  // Lines 124-133: EMAIL VERIFICATION PROCESS
  isEmailVerified: {
    type: Boolean,
    default: false                   // Starts as "not verified"
  },
  
  emailVerificationToken: String,                 // Token sent in email
  emailVerificationExpires: Date,                 // When does token expire?
  
  // ----- PASSWORD RESET SECTION -----
  
  // Lines 132-133: FORGOT PASSWORD
  resetPasswordToken: String,                     // Token sent in reset email
  resetPasswordExpires: Date,                     // When does this expire?
  
  // ----- ASSESSMENT SCORES SECTION -----
  
  // Lines 136-144: STORE LATEST TEST SCORE
  lastAssessmentScore: {
    type: Number,
    default: 0                       // Starts at 0
  },
  
  lastAssessmentClassification: {
    type: String,
    enum: ["Low", "Medium", "High", null],  // Only these values
    default: null
  },
  
  // ----- NOTIFICATION SETTINGS -----
  
  // Lines 146-155: HOW TO NOTIFY USER
  notificationPreferences: {
    system: {
      type: Boolean,
      default: true                  // Get system notifications by default
    },
    email: {
      type: Boolean,
      default: false                 // Don't email by default
    }
  }
  
}, { timestamps: true });  // Auto-add createdAt & updatedAt times

// ====== LINES 160-166: FUNCTION TO CREATE LOGIN TOKEN ======
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(                   // Create secure token
    {                                // Put this data IN the token
      userId: this._id,              // User's ID
      role: this.role,               // User's role (admin, employee, etc)
      orgName: this.orgName          // User's organization
    },
    process.env.JWT_SECRET,          // Secret key from settings file
    { expiresIn: "3h" }              // Token expires after 3 hours
  );
};

// ====== LINES 168-172: CREATE SEARCH SHORTCUTS ======
userSchema.index({ invitationToken: 1 });       // Fast search by token
userSchema.index({ orgName: 1, role: 1 });      // Fast search by org + role
userSchema.index({ role: 1 });                  // Fast search by role
userSchema.index({ emailVerificationToken: 1 }); // Fast search by email token
userSchema.index({ resetPasswordToken: 1 });    // Fast search by reset token

// ====== LINE 174: EXPORT MODEL ======
export default mongoose.model("User", userSchema);  // Export so others can use
```

**Real-World Example:**
```javascript
// When user signs up, we create a document like:
{
  _id: "507f1f77bcf86cd799439011",  // Auto-generated ID
  email: "john@example.com",
  password: "securepassword123",
  role: "employee",
  orgName: "Google",
  firstName: "John",
  lastName: "Doe",
  department: "Sales",
  isEmailVerified: false,
  emailVerificationToken: "abc123xyz",
  emailVerificationExpires: "2026-05-26T10:00:00.000Z",
  profileCompleted: false,
  createdAt: "2026-05-25T10:00:00.000Z",
  updatedAt: "2026-05-25T10:00:00.000Z"
}
```

---

### ASSESSMENT MODEL - `src/models/assessment.model.js`

**What it does:** Stores information about each test someone takes

```javascript
import mongoose, { Schema } from "mongoose";

const assessmentSchema = new Schema({
  
  // ----- WHO IS TAKING IT -----
  
  // Lines 4-7: STAKEHOLDER
  stakeholder: {
    type: String,                   // What role? Employee? Manager?
    required: true                  // MUST specify who
  },
  
  // Lines 9-12: WHICH USER?
  userId: {
    type: Schema.Types.ObjectId,    // Link to User table
    ref: "User"                     // References the User model
  },
  
  // Lines 14-16: EMPLOYEE'S EMAIL (for quick lookup)
  employeeEmail: { type: String },
  
  // Lines 18-21: WHO SENT THE INVITATION?
  invitedBy: {
    type: Schema.Types.ObjectId,    // Points to User who invited
    ref: "User"
  },
  
  // Lines 23-25: WHICH COMPANY?
  orgName: { type: String },        // Organization name
  
  // Lines 27-31: LINK TO INVITATION RECORD
  invitationId: {
    type: Schema.Types.ObjectId,    // Link to Invitation
    ref: "Invitation",
    required: false
  },
  
  // ----- SNAPSHOT OF USER AT SUBMISSION TIME -----
  
  // Lines 34-37: SAVE USER INFO
  userDetails: {
    type: Object,                   // Can store anything
    default: null                   // Empty at first
  },
  
  // ----- TEST STATUS -----
  
  // Lines 39-42: IS TEST DONE?
  isCompleted: {
    type: Boolean,
    default: false                  // Starts as "not done"
  },
  
  // Lines 44-46: WHEN WAS IT SUBMITTED?
  submittedAt: { type: Date },      // The date/time of submission
  
  // ----- ANSWERS SECTION -----
  
  // Lines 48-58: ARRAY OF ALL ANSWERS
  responses: [
    {
      questionId: { type: Schema.Types.ObjectId, ref: "Question" },
      questionCode: String,         // Code like "PP-MA-E1"
      answer: Schema.Types.Mixed,   // Can be 1-5, "A", "B", or anything
      comment: String               // User's explanation
    }
  ],
  
  // ----- SCORES SECTION -----
  
  // Lines 60-66: CALCULATION RESULTS
  scores: {
    overall: { type: Number, default: 0 },  // Overall score 0-100
    domains: {
      type: Schema.Types.Mixed,     // Could have multiple domains
      default: {}                   // Empty object at first
    }
  },
  
  // Lines 68-72: RATING CLASSIFICATION
  classification: {
    type: String,                   // "Low", "Medium", or "High"
    enum: ["Low", "Medium", "High"],
    default: "Low"
  },
  
  // ----- SOFT DELETE (Recoverable) -----
  
  // Lines 75-86: MARK AS DELETED BUT KEEP DATA
  isDeleted: {
    type: Boolean,
    default: false                  // Starts as "not deleted"
  },
  
  deletedAt: { type: Date, default: null },       // When deleted?
  deletedReason: { type: String, default: null }  // Why deleted?
  
}, { timestamps: true });  // Auto-add createdAt & updatedAt

// ====== INDEXES FOR FAST SEARCHING ======
assessmentSchema.index({ userId: 1 });
assessmentSchema.index({ invitationId: 1 });
assessmentSchema.index({ isCompleted: 1 });
assessmentSchema.index({ employeeEmail: 1 });
assessmentSchema.index({ userId: 1, isCompleted: 1, submittedAt: -1 });
assessmentSchema.index({ orgName: 1, isCompleted: 1 });
assessmentSchema.index({ orgName: 1 });

export default mongoose.model("Assessment", assessmentSchema);
```

**Real-World Example:**
```javascript
{
  _id: "507f191e810c19729de860ea",
  stakeholder: "employee",
  userId: "507f1f77bcf86cd799439011",  // Links to John Doe
  employeeEmail: "john@example.com",
  invitedBy: "507f1f77bcf86cd799439012",  // Manager's ID
  orgName: "Google",
  invitationId: "507f191e810c19729de860eb",
  userDetails: {
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    role: "employee"
  },
  isCompleted: false,                  // Still taking test
  submittedAt: null,
  responses: [
    { questionId: "...", questionCode: "PP-MA-E1", answer: 4, comment: "I try my best" },
    { questionId: "...", questionCode: "PP-MA-E2", answer: "A", comment: "I prefer this" }
  ],
  scores: {
    overall: 0,
    domains: {}
  },
  classification: "Low",
  createdAt: "2026-05-25T10:00:00.000Z",
  updatedAt: "2026-05-25T10:00:00.000Z"
}
```

---

### QUESTION MODEL - `src/models/question.model.js`

**What it does:** Stores the actual test questions that users answer

```javascript
import mongoose, { Schema } from "mongoose";
import { ROLE_DOMAIN_SUBDOMAINS } from "../constants/roleDomainSubdomains.js";

const questionSchema = new Schema({
  
  // ----- CATEGORIZATION -----
  
  // Lines 7-11: WHO IS THIS FOR?
  stakeholder: {
    type: String,
    enum: ["leader", "manager", "employee", "admin"],  // Only 4 options
    required: true                  // MUST specify
  },
  
  // Lines 13-17: WHAT TOPIC?
  domain: {
    type: String,
    enum: ["People Potential", "Operational Steadiness", "Digital Fluency"],  // 3 main topics
    required: true
  },
  
  // Lines 19-28: WHAT SUB-TOPIC?
  subdomain: {
    type: String,                   // Like "Mindset & Adaptability"
    required: true,
    validate: {
      validator: function (value) {
        // Check: Is this subdomain valid for this stakeholder & domain?
        return ROLE_DOMAIN_SUBDOMAINS[this.stakeholder]?.[this.domain]?.includes(value);
      },
      message: "Invalid subdomain for selected stakeholder and domain"
    }
  },
  
  // Lines 30-34: QUESTION FORMAT
  questionType: {
    type: String,
    enum: ["Self-Rating", "Calibration", "Behavioural", "Forced-Choice"],
    required: true
    // Self-Rating: Rate yourself 1-5
    // Calibration: How often? Never to Always
    // Behavioural: Yes/No question
    // Forced-Choice: Choose A or B
  },
  
  // Lines 36-39: QUESTION CODE
  questionCode: {
    type: String,                   // Auto-generated code like "PP-MA-E1"
    required: true                  // All questions need unique code
  },
  
  // ----- ORGANIZATION & DEPARTMENT -----
  
  // Lines 41-44: WHICH COMPANY?
  orgName: {
    type: String,
    default: null                   // null = Master template for all companies
  },
  
  // Lines 45-48: WHICH DEPARTMENT?
  department: {
    type: String,
    default: null                   // null = All departments
  },
  
  // ----- THE QUESTION TEXT -----
  
  // Lines 50-53: THE ACTUAL QUESTION
  questionStem: {
    type: String,                   // The question text
    required: true                  // MUST have question
  },
  
  // Lines 55-59: HOW TO ANSWER?
  scale: {
    type: String,
    enum: ["SCALE_1_5", "NEVER_ALWAYS", "FORCED_CHOICE"],
    required: true
    // SCALE_1_5: Answer 1 to 5
    // NEVER_ALWAYS: Answer Never to Always
    // FORCED_CHOICE: Choose A or B
  },
  
  // Lines 61-63: HELP TEXT
  insightPrompt: {
    type: String                    // Helpful suggestion if stuck
  },
  
  // ----- FORCED-CHOICE QUESTIONS ONLY -----
  
  // Lines 65-78: OPTION A & B
  forcedChoice: {
    optionA: {
      label: String,                // Option A text
      insightPrompt: String         // Help text for A
    },
    optionB: {
      label: String,                // Option B text
      insightPrompt: String         // Help text for B
    },
    higherValueOption: {
      type: String,
      enum: ["A", "B"]              // Which is better?
    }
  },
  
  // ----- DELETION -----
  
  // Lines 80-83: IS THIS DELETED?
  isDeleted: {
    type: Boolean,
    default: false                  // Not deleted by default
  },
  
  // ----- IMPORTANCE -----
  
  // Lines 85-92: WEIGHT IN SCORING
  subdomainWeight: {
    type: Number,                   // 0.35 = 35% importance
    required: true
  },
  
  order: {
    type: Number,                   // Question order (1st, 2nd, 3rd)
    default: 0
  }
  
}, { timestamps: true });

// ====== INDEXES FOR FAST SEARCHING ======
questionSchema.index({ questionCode: 1, orgName: 1, department: 1, stakeholder: 1 }, { unique: true });

export default mongoose.model("Question", questionSchema);
```

**Real-World Example:**
```javascript
{
  _id: "507f191e810c19729de860ec",
  stakeholder: "employee",
  domain: "People Potential",
  subdomain: "Mindset & Adaptability",
  questionType: "Self-Rating",
  questionCode: "PP-MA-E1",
  orgName: null,                      // Master template
  department: null,                   // All departments
  questionStem: "I'm open to changing how I work when priorities or information change.",
  scale: "SCALE_1_5",
  insightPrompt: "What makes it difficult to adjust how you work when priorities or information change?",
  forcedChoice: null,                 // Not a forced-choice question
  isDeleted: false,
  subdomainWeight: 0.35,
  order: 1,
  createdAt: "2026-01-15T10:00:00.000Z",
  updatedAt: "2026-01-15T10:00:00.000Z"
}
```

---

### RESPONSE MODEL - `src/models/response.model.js`

**What it does:** Stores one person's answer to one question

```javascript
import mongoose, { Schema } from "mongoose";

const responseSchema = new Schema({
  
  // ----- LINKING DATA -----
  
  // Lines 5-9: WHICH TEST?
  assessmentId: {
    type: Schema.Types.ObjectId,    // Links to Assessment
    ref: "Assessment",
    required: true                  // MUST have assessment
  },
  
  // Lines 11-15: WHICH QUESTION?
  questionId: {
    type: Schema.Types.ObjectId,    // Links to Question
    ref: "Question",
    required: true                  // MUST have question
  },
  
  // ----- QUESTION SNAPSHOT -----
  // (We store all this to preserve data if question is deleted later)
  
  // Lines 17-20: QUESTION CODE
  questionCode: {
    type: String,                   // E.g., "PP-MA-E1"
    required: true
  },
  
  // Lines 22-25: QUESTION TEXT
  questionStem: {
    type: String,                   // The actual question
    required: true
  },
  
  // Lines 27-31: WHO ANSWERED THIS?
  stakeholder: {
    type: String,
    enum: ["leader", "manager", "employee", "admin"],
    required: true
  },
  
  // Lines 33-37: QUESTION CATEGORY
  domain: {
    type: String,
    enum: ["People Potential", "Operational Steadiness", "Digital Fluency"],
    required: true
  },
  
  subdomain: {
    type: String,                   // Sub-category
    required: true
  },
  
  // Lines 44-48: QUESTION TYPE
  questionType: {
    type: String,
    enum: ["Self-Rating", "Calibration", "Behavioural", "Forced-Choice"],
    required: true
  },
  
  // Lines 50-54: ANSWER FORMAT
  scale: {
    type: String,
    enum: ["SCALE_1_5", "NEVER_ALWAYS", "FORCED_CHOICE"],
    required: true
  },
  
  // ----- THE ANSWER -----
  
  // Lines 56-58: NUMERIC ANSWER (For 1-5 scale)
  value: {
    type: Number                    // 1, 2, 3, 4, or 5
  },
  
  // Lines 60-63: OPTION ANSWER (For A/B choice)
  selectedOption: {
    type: String,                   // "A" or "B"
    enum: ["A", "B"]
  },
  
  // Lines 65-68: WHICH IS BETTER?
  higherValueOption: {
    type: String,                   // "A" or "B" = good answer
    enum: ["A", "B"]
  },
  
  // Lines 70-73: IS THIS GOOD OR BAD?
  valueDirection: {
    type: String,                   // "HIGHER" = good, "LOWER" = bad
    enum: ["HIGHER", "LOWER"]
  },
  
  // ----- EXTRA INFO -----
  
  // Lines 75-78: USER'S COMMENT
  comment: {
    type: String,                   // User's explanation
    default: null
  },
  
  // Lines 80-83: HELP TEXT SHOWN
  insightPrompt: {
    type: String,                   // What help was displayed?
    default: null
  },
  
  // Lines 85-89: HOW IMPORTANT?
  subdomainWeight: {
    type: Number,                   // 0.35 = 35%
    required: true,
    min: 0
  },
  
  // ----- DELETION TRACKING -----
  
  // Lines 92-99: WAS IT DELETED?
  isDeleted: {
    type: Boolean,                  // Soft delete flag
    default: false
  },
  
  deletedAt: {
    type: Date,                     // When deleted?
    default: null
  }
  
}, { timestamps: true });

// ====== INDEXES FOR FAST SEARCHING ======
responseSchema.index({ assessmentId: 1 });  // Find by assessment
responseSchema.index({ questionId: 1 });    // Find by question

export default mongoose.model("Response", responseSchema);
```

**Real-World Example:**
```javascript
{
  _id: "507f191e810c19729de860ed",
  assessmentId: "507f191e810c19729de860ea",  // Which test
  questionId: "507f191e810c19729de860ec",    // Which question
  questionCode: "PP-MA-E1",
  questionStem: "I'm open to changing how I work when priorities or information change.",
  stakeholder: "employee",
  domain: "People Potential",
  subdomain: "Mindset & Adaptability",
  questionType: "Self-Rating",
  scale: "SCALE_1_5",
  value: 4,                           // User answered "4"
  selectedOption: null,               // Not a forced-choice
  higherValueOption: null,
  valueDirection: null,
  comment: "I try to adapt quickly to changes",
  insightPrompt: "What makes it difficult to adjust...",
  subdomainWeight: 0.35,
  isDeleted: false,
  createdAt: "2026-05-25T10:30:00.000Z",
  updatedAt: "2026-05-25T10:30:00.000Z"
}
```

---

## PART 2: CONTROLLERS

### RESPONSE CONTROLLER - `src/controllers/response.controller.js`

**What it does:** Handles saving and retrieving answers to questions

```javascript
/**
 * SAVE RESPONSE (Auto-save when user answers)
 * 
 * How it works:
 * 1. User answers question
 * 2. Frontend sends answer to this function
 * 3. We validate the answer
 * 4. We save it to database
 */
export const saveResponse = async (req, res) => {
  try {
    // Line 9: Get array of responses from request
    const responses = req.body.responses;
    // Example: [
    //   { assessmentId: "...", questionId: "...", answer: 4, comment: "" },
    //   { assessmentId: "...", questionId: "...", answer: "A", comment: "..." }
    // ]

    // Lines 11-13: Check that we have responses
    if (!Array.isArray(responses) || responses.length === 0) {
      return res.status(400).json({ message: "Invalid response data" });
      // If data is wrong, send error back
    }

    // ===== OPTIMIZATION: Get all questions at once =====
    // (Instead of asking database 100 times, ask once for 100 items)

    // Line 16: Extract unique question IDs
    const questionIds = [...new Set(responses.map(r => r.questionId))];
    // Remove duplicates: [id1, id2, id1] becomes [id1, id2]

    // Line 17: Fetch all questions from database
    const questions = await Question.find({ _id: { $in: questionIds } }).lean();
    // .lean() = Get data without extra Mongoose features (faster)

    // Lines 18-19: Create quick lookup map
    const questionMap = {};
    questions.forEach(q => { questionMap[q._id.toString()] = q; });
    // Now we can look up any question super fast

    // Line 21: Prepare list of bulk operations
    const bulkOps = [];
    // We'll do 100 saves at once instead of 100 separate database calls

    // ===== PROCESS EACH ANSWER =====

    // Line 22: Loop through each answer
    for (let response of responses) {
      const { assessmentId, questionId, questionCode, answer, comment } = response;
      // Destructure = pull out values from object
      // answer could be: 4 (for scale), "A" (for forced-choice)
      // comment: user's explanation

      // Lines 25-27: Validate required fields exist
      if (!assessmentId || !questionId || !questionCode || answer === undefined) {
        return res.status(400).json({ message: "Invalid response data" });
        // Missing data = send error
      }

      // Lines 29-32: Get the actual question
      const question = questionMap[questionId.toString()];
      // Look up using our fast map

      if (!question) {
        return res.status(404).json({ message: `Question ${questionId} not found` });
        // If question doesn't exist, error
      }

      let finalComment = comment;
      // Start with comment as-is, might change below

      // ===== COMMENT VALIDATION LOGIC =====

      // Lines 36-42: If answer is LOW (1-2), REQUIRE a comment
      if (question.scale === "SCALE_1_5" || question.questionType === "Calibration") {
        // Check if user answered "Never" (1) or "Rarely" (2)
        
        if (answer <= 2 && !comment?.trim()) {
          // answer <= 2 = low score
          // !comment?.trim() = no comment (or just spaces)
          return res.status(400).json({ 
            message: "Comment is required for 'Never' or 'Rarely' answers." 
          });
          // Reject: must explain low score
        } else if (answer > 2) {
          // answer > 2 = high score (3, 4, 5)
          finalComment = null;
          // No comment needed for good score
        }
      }
      // Lines 43-49: For forced-choice, ALWAYS need comment
      else if (question.scale === "FORCED_CHOICE") {
        if (!comment?.trim()) {
          return res.status(400).json({ 
            message: `Comment is required for chosen option` 
          });
          // Always need explanation for A/B choice
        }
      }

      // ===== BUILD COMPLETE RESPONSE RECORD =====

      // Lines 51-74: Create detailed response object
      const fullResponseData = {
        assessmentId,                      // Which test?
        questionId: question._id,          // Which question?
        questionCode: question.questionCode,  // Question code
        questionStem: question.questionStem,  // Question text
        stakeholder: question.stakeholder,    // Employee/Manager?
        domain: question.domain,              // People Potential?
        subdomain: question.subdomain,        // Mindset?
        questionType: question.questionType,  // Self-Rating?
        scale: question.scale,                // 1-5 scale?
        
        // Value = numeric answer (for scales)
        value: typeof answer === "number" ? answer : null,
        // Example: if answer is 4, value = 4; if answer is "A", value = null

        // SelectedOption = A/B answer (for forced-choice)
        selectedOption: typeof answer === "string" ? answer : null,
        // Example: if answer is "A", selectedOption = "A"; if answer is 4, selectedOption = null

        higherValueOption: question.forcedChoice?.higherValueOption || null,
        // Which option is "better"? (only for forced-choice)

        // ValueDirection = Is this answer GOOD (HIGHER) or BAD (LOWER)?
        valueDirection: question.forcedChoice?.higherValueOption
          ? answer === question.forcedChoice.higherValueOption
            ? "HIGHER"     // They chose the good option
            : "LOWER"      // They chose the bad option
          : null,           // Not applicable (not forced-choice)

        comment: finalComment,             // Their explanation
        
        // insightPrompt = Help text to show based on their answer
        insightPrompt: (question.scale === "FORCED_CHOICE" && question.forcedChoice)
          ? (answer === "A" 
              ? question.forcedChoice.optionA?.insightPrompt  // Help for A
              : question.forcedChoice.optionB?.insightPrompt) // Help for B
            || question.insightPrompt
          : question.insightPrompt,

        subdomainWeight: question.subdomainWeight  // How important (0.35 = 35%)
      };

      // Lines 76-82: Create bulk operation
      bulkOps.push({
        updateOne: {
          filter: { assessmentId, questionId },  // Find by assessment & question
          update: { $set: fullResponseData },    // Update with our data
          upsert: true                           // Create if doesn't exist
        }
      });
      // upsert = "update or insert" (insert if new, update if exists)
    }

    // ===== SAVE ALL AT ONCE =====

    // Lines 85-86: Do all saves in one operation
    if (bulkOps.length > 0) {
      await Response.bulkWrite(bulkOps);  // Write all at once (faster)
    }

    // Lines 90-94: Return saved responses
    const assessmentIds = [...new Set(responses.map(r => r.assessmentId))];
    // Get unique assessment IDs

    const savedResponses = await Response.find({
      assessmentId: { $in: assessmentIds },   // For these assessments
      questionId: { $in: questionIds }        // And these questions
    }).lean();                                 // Get the responses

    res.status(200).json(savedResponses);     // Send back to frontend
  } catch (error) {
    res.status(500).json({
      message: "Error saving responses",
      error: error.message
    });
  }
};

/**
 * GET RESPONSES BY ASSESSMENT
 * 
 * When user views their submitted test, get all their answers
 */
export const getResponsesByAssessment = async (req, res) => {
  try {
    const { assessmentId } = req.params;
    // Extract assessment ID from URL
    // Example URL: /responses/507f191e810c19729de860ea
    // assessmentId = "507f191e810c19729de860ea"

    // Line 114: Check that ID exists
    if (!assessmentId) {
      return res.status(400).json({ message: "Assessment ID is required" });
    }

    // ===== TRY SUBMITTED SNAPSHOT FIRST =====
    // (Submitted assessments are finalized, this is preferred source)

    // Line 118: Import SubmittedAssessment model
    const SubmittedAssessment = (await import("../models/submittedAssessment.model.js")).default;

    // Line 119: Look for submitted assessment
    const submitted = await SubmittedAssessment.findOne({ assessmentId });
    // Try to find finalized/completed assessment

    // Lines 121-123: If found, return it
    if (submitted) {
      console.log(`Returning snapshotted data from SubmittedAssessment`);
      return res.status(200).json(submitted);
      // Send back submitted assessment (includes scores, etc)
    }

    // ===== FALLBACK: GET DRAFT RESPONSES =====
    // (If not submitted yet, get in-progress answers)

    // Line 127: Get all responses for this assessment
    const responses = await Response.find({ assessmentId });
    // Find all responses with this assessment ID

    // Lines 129-131: Check if found
    if (!responses.length) {
      return res.status(404).json({ message: "No responses found for this assessment" });
      // No data = error
    }

    res.status(200).json({ responses });
    // Send back in-progress responses
  } catch (error) {
    res.status(500).json({
      message: "Error fetching responses",
      error: error.message
    });
  }
};
```

---

## PART 3: ROUTES (API Endpoints)

### AUTH ROUTES - `src/routes/auth.routes.js`

**What it does:** Define all authentication-related URLs

```javascript
import express from "express";
import { ... } from "../controllers/auth.controller.js";  // Import functions
import { protect, flexibleProtect } from "../middlewares/auth.middleware.js";  // Import security

const router = express.Router();  // Create router object

// ===== CORE AUTHENTICATION =====

// Line 44: Sign up new user
router.post("/register", register);
// POST /api/v1/auth/register
// Body: { email, password, role }
// Returns: { message: "Registration successful" }

// Line 45: Sign in existing user
router.post("/login", login);
// POST /api/v1/auth/login
// Body: { email, password }
// Returns: { message: "Login successful", accessToken, user }

// Line 46: Sign out
router.post("/logout", logout);
// POST /api/v1/auth/logout
// Clears authentication cookies

// Line 47: Verify email
router.get("/verify-email/:token", verifyEmail);
// GET /api/v1/auth/verify-email/abc123xyz
// User clicks email link with this token
// Verifies email belongs to user

// Line 48: Complete profile after email verification
router.post("/complete-profile", completeProfile);
// POST /api/v1/auth/complete-profile
// Body: { firstName, lastName, department, orgName }
// User fills in profile info after email verification

// ===== PASSWORD MANAGEMENT =====

// Line 49: Request password reset
router.post("/forgot-password", forgotPassword);
// POST /api/v1/auth/forgot-password
// Body: { email }
// System sends reset email

// Line 50: Redirect from email to reset page
router.get("/reset-password/:token", resetPasswordRedirect);
// GET /api/v1/auth/reset-password/abc123xyz
// User clicks link in reset email
// Redirects to password reset form

// Line 51: Actually change password
router.post("/reset-password", resetPassword);
// POST /api/v1/auth/reset-password
// Body: { password }
// Save new password

// Line 52: Change password when logged in
router.post("/change-password", protect, changePassword);
// POST /api/v1/auth/change-password
// Body: { oldPassword, newPassword, confirmPassword }
// "protect" = user must be logged in
// User changes their own password

// ===== SESSION MANAGEMENT =====

// Line 54: Get current logged-in user info
router.get("/current-user-session", getCurrentUserSession);
// GET /api/v1/auth/current-user-session
// Returns: { email, role, inheritedOrgName, department }

// Line 55: Get all organizations
router.get("/organizations", protect, getAllOrganizations);
// GET /api/v1/auth/organizations
// "protect" = must be logged in
// Returns: { organizations: ["Google", "Microsoft", "Apple"] }

// ===== ORGANIZATION MANAGEMENT =====

// Line 56: Get team members in an organization
router.get("/organization/:name", protect, getOrganizationMembers);
// GET /api/v1/auth/organization/Google
// Returns all members of Google organization
// Shows their assessment status

// Line 57: Get filter options for organization
router.get("/organization-filters/:name", protect, getOrganizationFilters);
// GET /api/v1/auth/organization-filters/Google
// Returns members, departments for filtering

// ===== INVITATIONS =====

// Line 60: Send invitation to one person
router.post("/send-invitation", protect, sendInvitation);
// POST /api/v1/auth/send-invitation
// Body: { email, role, department }
// "protect" = must be logged in (usually admin)
// Sends invite link to email

// Line 61: Accept invitation (click link from email)
router.get("/invite/:token", acceptInvitation);
// GET /api/v1/auth/invite/abc123xyz
// User clicks link from invite email
// Starts registration with pre-filled info

// Line 62: Get invitations sent by current user
router.get("/invitations", protect, getInvitations);
// GET /api/v1/auth/invitations
// Admin sees all invites they sent
// Shows pending/accepted/expired status

// Line 63: Delete an invitation
router.delete("/invitation/:id", protect, deleteInvitation);
// DELETE /api/v1/auth/invitation/507f191e810c19729de860ef
// Admin cancels an invite

// Line 64: Reset assessment (let user retake test)
router.delete("/reset-assessment/:id", protect, resetAssessment);
// DELETE /api/v1/auth/reset-assessment/507f191e810c19729de860ea
// Admin clears user's test so they can retake it

// Line 65: Bulk invite (upload CSV)
router.post("/send-bulk-invitation", protect, uploadCSV, sendBulkInvitations);
// POST /api/v1/auth/send-bulk-invitation
// Upload CSV file with email addresses
// Send invitations to all at once

// Line 66: Get details about an invitation
router.get("/invitation-details/:token", getInvitationDetails);
// GET /api/v1/auth/invitation-details/abc123xyz
// Before accepting invite, see what org/role you're joining

// ===== USER PROFILE =====

// Line 69: Get current user info (flexible - logged in or not)
router.get("/me", flexibleProtect, getMe);
// GET /api/v1/auth/me
// "flexibleProtect" = works if logged in, but not required
// Returns current user data

// Line 70: Get full profile
router.get("/my-profile", flexibleProtect, myProfile);
// GET /api/v1/auth/my-profile
// Returns full profile with all details

// Line 71: Update profile
router.patch("/update-profile", protect, upload.fields([...]), updateProfile);
// PATCH /api/v1/auth/update-profile
// Body: Form data (can include file uploads)
// Can upload profile picture, org logo
// "upload.fields" = specify which file fields allowed

// ===== NOTIFICATIONS =====

// Line 74: Get all notifications
router.get("/notifications", protect, getNotifications);
// GET /api/v1/auth/notifications
// Returns list of all alerts

// Line 75: Mark one notification as read
router.patch("/notifications/:id/read", protect, markAsRead);
// PATCH /api/v1/auth/notifications/507f191e810c19729de860f0/read
// User saw notification

// Line 76: Mark all notifications as read
router.patch("/notifications/read-all", protect, markAllAsRead);
// PATCH /api/v1/auth/notifications/read-all
// Clear all unread notifications at once

// Line 77: Delete all notifications
router.delete("/notifications/clear-all", protect, clearNotifications);
// DELETE /api/v1/auth/notifications/clear-all
// Remove all notifications

// ===== PREFERENCES =====

// Line 80: Update notification preferences
router.patch("/update-notifications", protect, updateNotificationPreferences);
// PATCH /api/v1/auth/update-notifications
// Body: { system: true, email: false }
// User chooses which alerts to receive

export default router;  // Export so main app can use
```

---

## PART 4: MIDDLEWARE (Gatekeepers)

**What it does:** Check permission before allowing access to routes

```javascript
// PROTECT MIDDLEWARE
// Lines in auth.middleware.js:

export const protect = async (req, res, next) => {
  // WHAT: Check if user is logged in
  // WHEN: Before accessing protected routes
  
  try {
    // Step 1: Get token from request
    const token = req.cookies.accessToken || req.headers.authorization?.split(" ")[1];
    // Try to get from cookie first, then header
    
    if (!token) {
      return res.status(401).json({ message: "Not authenticated" });
      // No token = not logged in = reject
    }

    // Step 2: Verify token is valid
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // If token is tampered with, this fails
    // If token expired, this fails
    // If valid: decoded = { userId, role, orgName }

    // Step 3: Attach user info to request
    req.user = decoded;
    // Now other functions can access req.user

    // Step 4: Move to next function
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

export const restrictTo = (...roles) => {
  // WHAT: Check if user has correct role
  // USAGE: restrictTo("admin", "superAdmin")
  
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Not authorized for this action" });
      // User role not in allowed list = reject
    }
    next();
    // User has correct role = proceed
  };
};
```

---

## PART 5: COMPLETE FLOW EXAMPLE

**How everything works together:**

```
SCENARIO: Employee Takes Assessment

STEP 1: EMPLOYEE RECEIVES INVITATION
  └─ Admin clicks "Send Invitation"
  └─ Controller calls: sendInvitation()
  └─ New Invitation document created in database
  └─ Email sent to employee with link: /invite/abc123xyz
  └─ Employee clicks link in email

STEP 2: EMPLOYEE SIGNS UP
  └─ Route: GET /api/v1/auth/invite/abc123xyz
  └─ Frontend redirects to signup page
  └─ Employee enters email & password
  └─ Route: POST /api/v1/auth/register
  └─ Controller calls: register()
  │
  └─ Validation:
  │  ├─ Check email matches invitation
  │  ├─ Check invitation not expired
  │  └─ Check invitation not used
  │
  └─ Create new User document:
  │  ├─ email: "john@example.com"
  │  ├─ password: (encrypted)
  │  ├─ role: "employee" (from invitation)
  │  ├─ orgName: "Google" (from invitation)
  │  ├─ isEmailVerified: false
  │  └─ emailVerificationToken: "xyz789abc"
  │
  └─ Send verification email with link: /verify-email/xyz789abc
  └─ Employee checks email, clicks verification link

STEP 3: EMAIL VERIFICATION
  └─ Route: GET /api/v1/auth/verify-email/xyz789abc
  └─ Controller calls: verifyEmail()
  │
  └─ Validation:
  │  ├─ Find user with this token
  │  └─ Check token not expired
  │
  └─ Update User document:
  │  └─ isEmailVerified: true
  │
  └─ Redirect to profile completion page
  └─ Frontend shows form for: firstName, lastName, department

STEP 4: COMPLETE PROFILE
  └─ Employee fills form:
  │  ├─ First Name: "John"
  │  ├─ Last Name: "Doe"
  │  └─ Department: "Sales"
  │
  └─ Route: POST /api/v1/auth/complete-profile
  └─ Controller calls: completeProfile()
  │
  └─ Validation:
  │  ├─ Check email verification token
  │  ├─ Validate department is in organization's list
  │  └─ Check organization name not taken (if admin)
  │
  └─ Update User document:
  │  ├─ firstName: "John"
  │  ├─ lastName: "Doe"
  │  ├─ department: "Sales"
  │  └─ profileCompleted: true
  │
  └─ Mark Invitation as used
  └─ Send notification to admin: "John Doe joined!"

STEP 5: EMPLOYEE LOGS IN
  └─ Employee returns, goes to login page
  └─ Enters: email + password
  └─ Route: POST /api/v1/auth/login
  └─ Controller calls: login()
  │
  └─ Validation:
  │  ├─ Check email exists
  │  ├─ Check email verified
  │  └─ Check password matches
  │
  └─ Create JWT token:
  │  ├─ Data: { userId, role, orgName }
  │  ├─ Sign with JWT_SECRET
  │  └─ Set expiration: 24 hours
  │
  └─ Return: { accessToken, user: {...} }
  └─ Frontend stores token in cookie/localStorage
  └─ Frontend redirects to assessment page

STEP 6: START ASSESSMENT
  └─ Employee clicks "Start Assessment"
  └─ Route: POST /api/v1/assessment/start
  └─ Middleware "protect":
  │  ├─ Check token exists
  │  ├─ Verify token signature
  │  └─ Extract: userId, role, orgName
  │
  └─ Controller calls: startAssessment()
  │
  └─ Validation:
  │  ├─ Check user is not admin/superAdmin
  │  ├─ Check if they already took assessment
  │  ├─ Check if assessment cycle is due (every 3 months)
  │  └─ Check for incomplete assessment to resume
  │
  └─ Create Assessment document:
  │  ├─ stakeholder: "employee"
  │  ├─ userId: "507f1f77bcf86cd799439011"
  │  ├─ orgName: "Google"
  │  ├─ isCompleted: false
  │  └─ responses: []
  │
  └─ Return: { assessmentId: "507f191e810c19729de860ea" }
  └─ Frontend loads questions for this assessment

STEP 7: LOAD QUESTIONS
  └─ Route: GET /api/v1/questions?stakeholder=employee
  └─ Controller calls: getQuestionsByStakeholder()
  │
  └─ Query logic:
  │  ├─ Find questions for: orgName="Google", stakeholder="employee"
  │  ├─ If none found, use Master Template (orgName=null)
  │  └─ Sort by order field
  │
  └─ Return: [
  │   { questionCode: "PP-MA-E1", questionStem: "I'm open to...", scale: "SCALE_1_5", ... },
  │   { questionCode: "PP-MA-E2", questionStem: "When priorities...", scale: "SCALE_1_5", ... },
  │   ...
  │ ]
  └─ Frontend displays questions on screen

STEP 8: ANSWER QUESTION (Autosave)
  └─ Employee reads question, selects answer
  └─ Frontend sends after each answer:
  │
  └─ Route: POST /api/v1/responses
  └─ Body: {
  │   responses: [
  │     { assessmentId, questionId, answer: 4, comment: "I try hard" }
  │   ]
  │ }
  │
  └─ Middleware "flexibleProtect":
  │  └─ User can be logged in or not
  │
  └─ Controller calls: saveResponse()
  │
  └─ Processing:
  │  ├─ Get question details for all submitted answers
  │  ├─ Validate comment requirement:
  │  │  ├─ If answer <= 2: REQUIRE comment
  │  │  └─ If answer > 2: No comment needed
  │  └─ If Forced-Choice: ALWAYS require comment
  │
  └─ Create Response documents:
  │  ├─ assessmentId: "507f191e810c19729de860ea"
  │  ├─ questionId: "507f191e810c19729de860ec"
  │  ├─ answer: 4
  │  ├─ comment: "I try hard"
  │  ├─ questionCode: "PP-MA-E1"
  │  ├─ domain: "People Potential"
  │  └─ value: 4
  │
  └─ Save to database (bulk operation for speed)
  └─ Return saved responses

STEP 9: SUBMIT ASSESSMENT
  └─ Employee finishes all questions
  └─ Clicks "Submit Assessment"
  └─ Route: POST /api/v1/assessment/:assessmentId/submit
  └─ Body: { firstName, lastName, department }
  │
  └─ Controller calls: submitAssessment()
  │
  └─ Processing:
  │  ├─ Fetch Assessment document
  │  ├─ Fetch all Response documents for this assessment
  │  └─ Calculate scores:
  │  │  ├─ For each domain: average the subdomain scores
  │  │  ├─ Calculate overall score (weighted average)
  │  │  └─ Classify: Low/Medium/High
  │  │
  │  ├─ Generate feedback:
  │  │  ├─ For each domain: find lowest subdomain
  │  │  └─ Get insight text for lowest area
  │  │
  │  └─ Save Assessment:
  │     ├─ isCompleted: true
  │     ├─ submittedAt: current timestamp
  │     ├─ scores: { overall: 72, domains: {...} }
  │     └─ classification: "Medium"
  │
  └─ Create SubmittedAssessment snapshot:
  │  ├─ Copy all data from Assessment
  │  ├─ Lock in user details (name, department)
  │  └─ Store for reporting
  │
  └─ Send notifications:
  │  ├─ Notify user: "Assessment submitted successfully!"
  │  ├─ Notify manager: "John submitted assessment"
  │  └─ Notify admin: "Google employee submitted"
  │
  └─ Return: { scores, classification, submittedAssessment }
  └─ Frontend shows results

STEP 10: VIEW RESULTS (Dashboard)
  └─ Admin views dashboard
  └─ Route: GET /api/v1/dashboard/admin
  └─ Controller calls: getAdminIntelligence()
  │
  └─ Query operations:
  │  ├─ Get all users in organization
  │  ├─ Get all assessments (completed & in-progress)
  │  ├─ Get all invitations (pending & accepted)
  │  └─ Calculate statistics:
  │     ├─ Total team members
  │     ├─ Assessments completed: 8/10
  │     ├─ Participation rate: 80%
  │     ├─ Average score per domain
  │     └─ Completion by role
  │
  └─ Return: {
  │   stats: { totalMembers: 10, completedAssessments: 8, ... },
  │   roleBreakdown: { employee: 7, manager: 2, leader: 1 },
  │   activityStream: [ ... ],
  │   people: [ ... ],
  │   strategicInsight: "Great engagement..."
  │ }
  │
  └─ Frontend displays dashboard with charts & data
```

---

This complete breakdown shows:
- ✅ What each line does
- ✅ Why it does it
- ✅ How data flows through system
- ✅ Real examples of data documents
- ✅ Complete user journey

You can use this document as reference while reading the code!
