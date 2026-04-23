import Assessment from "../models/assessment.model.js";
import User from "../models/user.model.js";
import Response from "../models/response.model.js";
import SubmittedAssessment from "../models/submittedAssessment.model.js";
import Invitation from "../models/invitation.model.js";
import mongoose from "mongoose";
import { calculateAssessmentScores } from "../utils/scoring.utils.js";
import { getSubdomainFeedback } from "../utils/feedback.utils.js";
import { createNotification, notifySuperAdmins, notifyHierarchy } from "../utils/notification.utils.js";



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

    // 3️⃣ 🔒 CHECK IF ALREADY EXISTS — exclude soft-deleted (reset) assessments
    const existingAssessment = await Assessment.findOne({
      invitationId,
      isDeleted: { $ne: true }
    });

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

    const assessment = await Assessment.findOne({
      _id: new mongoose.Types.ObjectId(assessmentId),
      isDeleted: { $ne: true }
    });

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
      email: email.toLowerCase(),
      department,
      role: assessment.stakeholder || "employee",
      orgName: assessment.orgName
    };

    assessment.userDetails = employeeDetails;
    assessment.isCompleted = true;
    assessment.submittedAt = new Date();

    console.log(`[Employee Assessment Submission] Processing assessment ${assessmentId} for employee ${email}. Found ${responses.length} responses.`);

    // 🏆 Calculate scores (Phase 1 Logic)
    const { scores, classification } = calculateAssessmentScores(responses);
    console.log(`[Employee Assessment Submission] Scores calculated. Classification: ${classification}`);

    // 💡 Add feedback BEFORE assigning to model
    let fbCount = 0;
    const stakeholderRole = assessment.stakeholder || "employee";

    for (const domainName in scores.domains) {
      const domainObj = scores.domains[domainName];
      domainObj.subdomainFeedback = {};
      domainObj.feedback = null;

      let minScore = 200;
      let minSubName = null;

      for (const subName in domainObj.subdomains) {
        const subScore = domainObj.subdomains[subName];

        if (subScore <= minScore) {
          minScore = subScore;
          minSubName = subName;
        }

        const subFb = getSubdomainFeedback(subName, subScore, stakeholderRole);
        if (subFb) {
          fbCount++;
          domainObj.subdomainFeedback[subName] = subFb;
        }
      }

      // Finalize Domain-Level Feedback from the lowest scoring subdomain
      if (minSubName) {
        let domainFb = getSubdomainFeedback(minSubName, minScore, stakeholderRole);
        if (!domainFb) {
          // Fallback: If lowest subdomain has no entry, pick ANY available feedback from the other subdomains in this domain
          const availableSubs = Object.keys(domainObj.subdomainFeedback);
          if (availableSubs.length > 0) {
            domainFb = domainObj.subdomainFeedback[availableSubs[0]];
            console.log(`[Feedback Fallback] Used "${availableSubs[0]}" insight for domain "${domainName}" because "${minSubName}" was missing.`);
          }
        }
        domainObj.feedback = domainFb || null;
      }
    }
    console.log(`[Employee Assessment Submission] Attached subdomain feedback. Total sub-feedbacks: ${fbCount}. Role: ${stakeholderRole}`);

    // Assign the fully-built scores object (with feedback already included)
    assessment.scores = scores;
    assessment.classification = classification;

    // ⚠️ Tell Mongoose the nested object changed so it persists correctly
    assessment.markModified('scores');

    // Find the User record for this email to link correctly to the dashboard
    const submittingUser = await User.findOne({ email: email.toLowerCase() });

    if (submittingUser) {
      if (firstName) submittingUser.firstName = firstName;
      if (lastName) submittingUser.lastName = lastName;
      if (department) submittingUser.department = department;
      submittingUser.lastAssessmentScore = scores.overall;
      submittingUser.lastAssessmentClassification = classification;
    }

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
      ),
      submittingUser ? submittingUser.save() : Promise.resolve()
    ]);
    console.log(`[Employee Assessment Submission] Data saved and invitation locked for ${email}. Linked to userId: ${submittingUser ? submittingUser._id : "none"}`);

    // --- DYNAMIC NOTIFICATIONS ---
    if (submittingUser && submittingUser._id) {
      // 1. Notify the user
      createNotification({
        recipient: submittingUser._id,
        title: "Assessment Submitted",
        message: "Your assessment has been successfully submitted.",
        type: "success"
      }).catch(err => console.error("[Notification Error]", err));

      // 2. Hierarchical Notification
      notifyHierarchy({
        initiatorId: submittingUser._id,
        title: "Assessment Submitted",
        message: `${firstName} ${lastName} (${employeeDetails.role}) has completed their assessment.`,
        type: "success"
      }).catch(err => console.error("[Hierarchy Notification Error]", err));

      // 3. Notify Super Admins
      notifySuperAdmins({
        title: "New Assessment Activity",
        message: `${firstName} ${lastName} from ${assessment.orgName || "Unknown Org"} has submitted an assessment.`,
        type: "info",
        excludeUser: submittingUser._id
      }).catch(err => console.error("[Super Admin Notification Error]", err));
    } else {
      // Notify the person who invited them
      if (assessment.invitedBy) {
        createNotification({
          recipient: assessment.invitedBy,
          title: "Employee Assessment Submitted",
          message: `${firstName} ${lastName} has completed their assessment.`,
          type: "success"
        }).catch(err => console.error("[Notification Error]", err));
      }

      // Notify Super Admins
      notifySuperAdmins({
        title: "New Assessment Activity",
        message: `${firstName} ${lastName} from ${assessment.orgName || "Unknown Org"} has submitted an assessment.`,
        type: "info"
      }).catch(err => console.error("[Super Admin Notification Error]", err));
    }

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
