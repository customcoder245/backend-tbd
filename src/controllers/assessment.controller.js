import Assessment from "../models/assessment.model.js";
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

    // Ensure ObjectId types for assessmentId
    const assessmentObjectId = new mongoose.Types.ObjectId(assessmentId);

    // Fetch the assessment by ID
    const assessment = await Assessment.findById(assessmentObjectId);
    if (!assessment) {
      return res.status(404).json({ message: "Assessment not found" });
    }

    // Ensure the assessment isn't already completed
    if (assessment.isCompleted) {
      return res.status(400).json({ message: "Assessment already submitted" });
    }

    // Fetch all responses for this assessment (already saved with all question details)
    const responses = await Response.find({ assessmentId: assessmentObjectId });

    // If no responses, return an error
    if (!responses || responses.length === 0) {
      return res.status(400).json({ message: "No responses provided" });
    }

    // Directly use the saved responses data to populate the Assessment document
    assessment.isCompleted = true;
    assessment.submittedAt = new Date();
    assessment.responses = responses; // Directly save the existing responses in the Assessment document
    assessment.userId = userId; // Store the ID of the leader/manager who completed the assessment

    // Save the updated assessment
    const savedAssessment = await assessment.save();

    // Return success response
    return res.status(200).json({
      message: "Assessment submitted successfully",
      savedAssessment
    });
  } catch (error) {
    console.error("Error submitting assessment:", error);
    res.status(500).json({
      message: "Error submitting assessment",
      error: error.message
    });
  }
};
