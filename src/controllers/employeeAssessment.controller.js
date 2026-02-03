import Assessment from "../models/assessment.model.js";
import Response from "../models/response.model.js";
import SubmittedAssessment from "../models/submittedAssessment.model.js";
import Invitation from "../models/invitation.model.js";
import mongoose from "mongoose";


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
      department
    };

    assessment.employeeDetails = employeeDetails;
    assessment.isCompleted = true;
    assessment.submittedAt = new Date();

    await assessment.save();

    // 4️⃣ Snapshot (immutable record)
    const submittedAssessment = await SubmittedAssessment.create({
      assessmentId: assessment._id,
      stakeholder: "employee",
      employeeDetails,
      responses,
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
