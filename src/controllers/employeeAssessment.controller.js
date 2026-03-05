import Assessment from "../models/assessment.model.js";
import Response from "../models/response.model.js";
import SubmittedAssessment from "../models/submittedAssessment.model.js";
import Invitation from "../models/invitation.model.js";
import mongoose from "mongoose";
import { calculateAssessmentScores } from "../utils/scoring.utils.js";
import { getDomainFeedback } from "../utils/feedback.utils.js";



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
      const domainScore = scores.domains[domainName].score;
      const fb = getDomainFeedback(domainName, domainScore, 'employee');
      if (fb) fbCount++;
      scores.domains[domainName].feedback = fb;
    }
    console.log(`[Employee Assessment Submission] Attached feedback to ${fbCount}/${Object.keys(scores.domains).length} domains.`);

    // Assign the fully-built scores object (with feedback already included)
    assessment.scores = scores;
    assessment.classification = classification;

    // ⚠️ Tell Mongoose the nested object changed so it persists correctly
    assessment.markModified('scores');

    await assessment.save();
    console.log(`[Employee Assessment Submission] Assessment ${assessmentId} saved.`);

    // 4️⃣ Snapshot (immutable record)
    const submittedAssessment = await SubmittedAssessment.create({
      assessmentId: assessment._id,
      stakeholder: "employee",
      userDetails: employeeDetails,
      responses,
      scores,
      classification,
      submittedAt: new Date()
    });

    // 5️⃣ Lock invitation (ONE TIME USE)
    await Invitation.findOneAndUpdate(
      { email, role: "employee" },
      { used: true }
    );

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
