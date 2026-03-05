import Assessment from "../models/assessment.model.js";
import User from "../models/user.model.js";
import Response from "../models/response.model.js";
import SubmittedAssessment from "../models/submittedAssessment.model.js";
import Invitation from "../models/invitation.model.js";
import mongoose from "mongoose";
import { calculateAssessmentScores } from "../utils/scoring.utils.js";
import { getSubdomainFeedback } from "../utils/feedback.utils.js";



export const startEmployeeAssessment = async (req, res) => {
  try {
    if (!req.employee) {
      return res.status(404).json({
        message: "Employee information not found. Invalid token."
      });
    }

    // 1️⃣ Extract raw invitationId
    const rawInvitationId =
      req.employee.invitationId || req.employee.invitedId;

    if (!rawInvitationId || !mongoose.Types.ObjectId.isValid(rawInvitationId)) {
      return res.status(400).json({
        message: "Invalid invitation ID"
      });
    }

    // 2️⃣ Cast to ObjectId
    const invitationId = new mongoose.Types.ObjectId(rawInvitationId);

    // 3️⃣ 🔒 CHECK IF ALREADY EXISTS (THIS IS THE MAIN FIX)
    const existingAssessment = await Assessment.findOne({ invitationId });

    if (existingAssessment) {
      return res.status(200).json({
        message: "Assessment already started",
        assessmentId: existingAssessment._id
      });
    }

    // 4️⃣ Create ONLY if not exists
    const assessment = await Assessment.create({
      stakeholder: "employee",
      invitedBy: req.employee.invitedBy,
      orgName: req.employee.orgName,
      employeeEmail: req.employee.email,
      invitationId
    });

    return res.status(201).json({
      message: "Employee assessment started",
      assessmentId: assessment._id
    });
  } catch (error) {
    console.error("startEmployeeAssessment error:", error);
    return res.status(500).json({
      message: "Error starting employee assessment",
      error: error.message
    });
  }
};



export const submitEmployeeAssessment = async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const {
      firstName,
      lastName,
      email,
      department
    } = req.body;

    // 1️⃣ Validate final form (matches UI)
    if (!firstName || !lastName || !email || !department) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    const assessment = await Assessment.findById(
      new mongoose.Types.ObjectId(assessmentId)
    );

    if (!assessment) {
      return res.status(404).json({ message: "Assessment not found" });
    }

    if (assessment.isCompleted) {
      return res.status(400).json({ message: "Assessment already submitted" });
    }

    // 2️⃣ Load responses
    const responses = await Response.find({ assessmentId });
    if (!responses.length) {
      return res.status(400).json({ message: "No responses found" });
    }

    // 3️⃣ Save employee details ON FINAL STEP
    const employeeDetails = {
      firstName,
      lastName,
      email,
      department,
      orgName: assessment.orgName
    };

    assessment.userDetails = employeeDetails;
    assessment.isCompleted = true;
    assessment.submittedAt = new Date();

    console.log(`[Employee Assessment Submission] Processing assessment ${assessmentId} for employee ${email}. Found ${responses.length} responses.`);

    // 🏆 Calculate scores (Phase 1 Logic)
    const { scores, classification } = calculateAssessmentScores(responses);
    console.log(`[Employee Assessment Submission] Scores calculated. Classification: ${classification}`);

    // 💡 Add feedback BEFORE assigning to model (Mongoose Mixed types don't track mutations after assignment)
    let fbCount = 0;
    for (const domainName in scores.domains) {
      const domainObj = scores.domains[domainName];
      domainObj.subdomainFeedback = {};

      let minScore = 101;
      let minSubName = null;

      for (const subName in domainObj.subdomains) {
        const subScore = domainObj.subdomains[subName];

        // Find lowest subdomain for domain-level insight
        if (subScore < minScore) {
          minScore = subScore;
          minSubName = subName;
        }

        const subFb = getSubdomainFeedback(subName, subScore, 'employee');
        if (subFb) {
          fbCount++;
          domainObj.subdomainFeedback[subName] = subFb;
        }
      }

      // 🏆 Rule: Domain-level feedback is based on the LOWEST scoring subdomain
      if (minSubName) {
        domainObj.feedback = getSubdomainFeedback(minSubName, minScore, 'employee');
      }
    }
    console.log(`[Employee Assessment Submission] Attached subdomain feedback. Total sub-feedbacks: ${fbCount}. Role: employee`);

    // Assign the fully-built scores object (with feedback already included)
    assessment.scores = scores;
    assessment.classification = classification;

    // ⚠️ Tell Mongoose the nested object changed so it persists correctly
    assessment.markModified('scores');

    // Find the User record for this email to link correctly to the dashboard
    const submittingUser = await User.findOne({ email: email.toLowerCase() });

    // 🔥 5️⃣ SAVE ASSESSMENT & SNAPSHOT (In parallel for speed)
    const [savedAssessment, submittedAssessment] = await Promise.all([
      assessment.save(),
      SubmittedAssessment.create({
        assessmentId: assessment._id,
        stakeholder: assessment.stakeholder,
        userId: submittingUser ? submittingUser._id : null, // 🏆 Link to user if they exist
        userDetails: employeeDetails,
        responses,
        scores,
        classification,
        submittedAt: new Date()
      }),
      Invitation.findOneAndUpdate(
        { email: email.toLowerCase(), role: "employee" },
        { used: true }
      )
    ]);
    console.log(`[Employee Assessment Submission] Data saved and invitation locked for ${email}. Linked to userId: ${submittingUser ? submittingUser._id : "none"}`);

    return res.status(200).json({
      message: "Assessment submitted successfully",
      submittedAssessment
    });

  } catch (error) {
    res.status(500).json({
      message: "Error submitting assessment",
      error: error.message
    });
  }
};
