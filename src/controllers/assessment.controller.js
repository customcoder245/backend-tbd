import Assessment from "../models/assessment.model.js";
import User from "../models/user.model.js";
import SubmittedAssessment from "../models/submittedAssessment.model.js";
import Response from "../models/response.model.js";
import mongoose from "mongoose";

/**
 * START ASSESSMENT
 * Creates draft assessment
 */
export const startAssessment = async (req, res) => {
  try {
    const { stakeholder, employeeDetails } = req.body;

    if (!stakeholder) {
      return res.status(400).json({ message: "Stakeholder is required" });
    }

    const assessmentData = { stakeholder };

    if (stakeholder === "leader" || stakeholder === "manager") {
      assessmentData.userId = req.user.userId;
    }

    if (stakeholder === "employee") {
      if (
        !employeeDetails?.firstName ||
        !employeeDetails?.lastName ||
        !employeeDetails?.email ||
        !employeeDetails?.department
      ) {
        return res.status(400).json({ message: "Employee details required" });
      }
      assessmentData.employeeDetails = employeeDetails;
    }

    const assessment = await Assessment.create(assessmentData);

    return res.status(201).json({
      message: "Assessment started",
      assessmentId: assessment._id
    });
  } catch (error) {
    res.status(500).json({
      message: "Error starting assessment",
      error: error.message
    });
  }
};


/**
 * SUBMIT ASSESSMENT (FINAL)
 */
export const submitAssessment = async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const { userId } = req.user;

    const assessmentObjectId = new mongoose.Types.ObjectId(assessmentId);

    // 1️⃣ Fetch assessment
    const assessment = await Assessment.findById(assessmentObjectId);
    if (!assessment) {
      return res.status(404).json({ message: "Assessment not found" });
    }

    if (assessment.isCompleted) {
      return res.status(400).json({ message: "Assessment already submitted" });
    }

    // 2️⃣ Fetch responses (JOIN)
    const responses = await Response.find({ assessmentId: assessmentObjectId });

    if (!responses || responses.length === 0) {
      return res.status(400).json({ message: "No responses provided" });
    }

    const fullResponses = responses.map(r => {
      const obj = r.toObject();
      delete obj.__v;
      return obj;
    });

    // 3️⃣ Fetch & clean user
    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const cleanedUserDetails = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      department: user.department,
      role: user.role
    };

    // 4️⃣ Mark assessment completed
    assessment.isCompleted = true;
    assessment.submittedAt = new Date();
    assessment.userId = userId;
    assessment.userDetails = cleanedUserDetails;
    await assessment.save();

    // 🔥 5️⃣ SAVE SNAPSHOT (THIS IS OPTION 2)
    const submittedAssessment = await SubmittedAssessment.create({
      assessmentId: assessment._id,
      stakeholder: assessment.stakeholder,
      userId,
      userDetails: cleanedUserDetails,
      responses: fullResponses,
      submittedAt: new Date()
    });

    // 6️⃣ Return response
    return res.status(200).json({
      message: "Assessment submitted successfully",
      submittedAssessment
    });
  } catch (error) {
    console.error("Error submitting assessment:", error);
    res.status(500).json({
      message: "Error submitting assessment",
      error: error.message
    });
  }
};