import Assessment from "../models/assessment.model.js";
import User from "../models/user.model.js";
import SubmittedAssessment from "../models/submittedAssessment.model.js";
import Response from "../models/response.model.js";
import mongoose from "mongoose";
import { createNotification, notifySuperAdmins, notifyOrgAdmins } from "../utils/notification.utils.js";
import Invitation from "../models/invitation.model.js";

/**
 * START ASSESSMENT
 * Creates draft assessment
 */
export const startAssessment = async (req, res) => {
  try {
    const { stakeholder } = req.body;
    // Assuming protect middleware provides req.user
    const { userId } = req.user;

    if (!stakeholder) {
      return res.status(400).json({ message: "Stakeholder is required" });
    }

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // 1. Fetch User details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check for existing INCOMPLETE assessment (Resume logic)
    const incompleteAssessment = await Assessment.findOne({
      userId,
      isCompleted: false
    }).sort({ createdAt: -1 });

    if (incompleteAssessment) {
      return res.status(200).json({
        message: "Resuming existing assessment",
        assessmentId: incompleteAssessment._id
      });
    }

    // Check for latest COMPLETED assessment (Recurring logic)
    const latestCompletedAssessment = await Assessment.findOne({
      userId,
      isCompleted: true
    }).sort({ submittedAt: -1 });

    if (latestCompletedAssessment) {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      if (latestCompletedAssessment.submittedAt > threeMonthsAgo) {
        // Calculate days remaining
        const nextDate = new Date(latestCompletedAssessment.submittedAt);
        nextDate.setMonth(nextDate.getMonth() + 3);
        const diffTime = Math.abs(nextDate - new Date());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return res.status(403).json({
          message: `You have already completed an assessment recently. Next assessment available in ${diffDays} days.`
        });
      }
    }

    // 2. Fetch Invitation (Optional now)
    // Logic: Find the invitation sent to this user's email.
    const invitation = await Invitation.findOne({ email: user.email }).sort({ createdAt: -1 });

    // 3. Prepare Assessment Data
    const assessmentData = {
      stakeholder,
      userId: user._id,
      // If invitation exists, use it. If not, null (allowed now).
      invitationId: invitation ? invitation._id : null,
      invitedBy: invitation?.invitedBy || user.adminId, // Fallback to adminId
      orgName: user.orgName || invitation?.orgName,
      employeeEmail: user.email,
      // Initialize userDetails snapshot from profile
      userDetails: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        department: user.department,
        role: user.role,
        orgName: user.orgName || invitation?.orgName
      }
    };

    const assessment = await Assessment.create(assessmentData);

    return res.status(201).json({
      message: "New assessment started",
      assessmentId: assessment._id
    });
  } catch (error) {
    console.error("Error starting assessment:", error);
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
      role: user.role,
      orgName: user.orgName
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

    // --- DYNAMIC NOTIFICATIONS ---
    // 1. Notify the user
    await createNotification({
      recipient: userId,
      title: "Assessment Submitted",
      message: "Your assessment has been successfully submitted.",
      type: "success"
    });

    // 2. Notify their Organization Admins
    if (user.orgName) {
      await notifyOrgAdmins({
        orgName: user.orgName,
        title: "Assessment Completed",
        message: `${user.firstName} ${user.lastName} (${user.role}) has completed the assessment.`,
        type: "success",
        excludeUser: userId
      });
    }

    // 3. Notify Super Admins
    await notifySuperAdmins({
      title: "New Assessment Activity",
      message: `${user.firstName} ${user.lastName} from ${user.orgName || "Unknown Org"} has submitted an assessment.`,
      type: "info",
      excludeUser: userId
    });

    // 6️⃣ Return response
    return res.status(200).json({
      message: "Assessment submitted successfully",
      submittedAssessment
    });
  } catch (error) {
    // console.error("Error submitting assessment:", error);
    res.status(500).json({
      message: "Error submitting assessment",
      error: error.message
    });
  }
};

// controllers/assessment.controller.js

export const getAssessmentStartData = async (req, res) => {
  return res.status(200).json({
    title: "POD-360™ | From Friction to Flow",
    description_one:
      "Every organization experiences friction especially during times of rapid and constant change.",
    description_two:
      "is a confidential, organization-level assessment designed to identify how friction impacts performance.",
    duration_minutes: 40
  });
};

/**
 * GET MY ASSESSMENTS (History)
 */
export const getMyAssessments = async (req, res) => {
  try {
    const { userId } = req.user;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const assessments = await Assessment.find({ userId })
      .select("-responses -userDetails -employeeDetails") // Exclude heavy detail fields
      .sort({ createdAt: -1 });

    res.status(200).json(assessments);
  } catch (error) {
    console.error("Error fetching my assessments:", error);
    res.status(500).json({ message: "Error fetching assessments" });
  }
};







// export const submitAssessment = async (req, res) => {
//   try {
//     const { assessmentId } = req.params;
//     const { employeeDetails } = req.body;  // Employee details (only for employee)
//     const { userId } = req.user;  // This is necessary for leaders/managers

//     const assessmentObjectId = new mongoose.Types.ObjectId(assessmentId);

//     // 1️⃣ Fetch assessment
//     const assessment = await Assessment.findById(assessmentObjectId);
//     if (!assessment) {
//       return res.status(404).json({ message: "Assessment not found" });
//     }

//     if (assessment.isCompleted) {
//       return res.status(400).json({ message: "Assessment already submitted" });
//     }

//     // 2️⃣ Fetch responses (JOIN)
//     const responses = await Response.find({ assessmentId: assessmentObjectId });

//     if (!responses || responses.length === 0) {
//       return res.status(400).json({ message: "No responses provided" });
//     }

//     const fullResponses = responses.map(r => {
//       const obj = r.toObject();
//       delete obj.__v;
//       return obj;
//     });

//     let finalUserDetails = null;
//     let finalEmployeeDetails = null;

//     // ✅ EMPLOYEE LOGIC: Collect employee details at the time of submission
//     if (assessment.stakeholder === "employee") {
//       if (
//         !employeeDetails?.firstName ||
//         !employeeDetails?.lastName ||
//         !employeeDetails?.email ||
//         !employeeDetails?.department
//       ) {
//         return res.status(400).json({ message: "Employee details are required" });
//       }

//       finalEmployeeDetails = employeeDetails;  // Store employee details
//     }

//     // ✅ LEADER/MANAGER LOGIC: Use user details from the logged-in user
//     if (assessment.stakeholder !== "employee") {
//       if (!userId) {
//         return res.status(401).json({ message: "Unauthorized: User not authenticated" });
//       }

//       const user = await User.findById(userId).lean();
//       if (!user) {
//         return res.status(404).json({ message: "User not found" });
//       }

//       finalUserDetails = {
//         _id: user._id,
//         firstName: user.firstName,
//         lastName: user.lastName,
//         email: user.email,
//         department: user.department,
//         role: user.role
//       };
//     }

//     // 3️⃣ Mark assessment as completed
//     assessment.isCompleted = true;
//     assessment.submittedAt = new Date();
//     if (assessment.stakeholder === "employee") {
//       assessment.employeeDetails = finalEmployeeDetails;  // Save employee details
//     }
//     assessment.userDetails = finalUserDetails;
//     await assessment.save();

//     // 4️⃣ Save snapshot (SubmittedAssessment)
//     const submittedAssessment = await SubmittedAssessment.create({
//       assessmentId: assessment._id,
//       stakeholder: assessment.stakeholder,
//       userId: userId || null,  // Save userId for leaders/managers, null for employees
//       userDetails: finalUserDetails,
//       employeeDetails: finalEmployeeDetails,  // Save employee details here as well
//       responses: fullResponses,
//       submittedAt: new Date()
//     });

//     // 5️⃣ Return response
//     return res.status(200).json({
//       message: "Assessment submitted successfully",
//       submittedAssessment
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: "Error submitting assessment",
//       error: error.message
//     });
//   }
// };
