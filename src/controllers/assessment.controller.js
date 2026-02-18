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

/**
 * GET SUPER ADMIN STATS (Org Assessment Overview)
 */
export const getSuperAdminStats = async (req, res) => {
  try {
    // 1. Aggregate Assessments (Completed count per org)
    const assessmentStats = await Assessment.aggregate([
      { $match: { isCompleted: true } },
      { $group: { _id: "$orgName", completedCount: { $sum: 1 } } }
    ]);

    // 2. Aggregate Invitations (Emails per org)
    const inviteStats = await Invitation.aggregate([
      { $group: { _id: "$orgName", emails: { $addToSet: "$email" } } }
    ]);

    // 3. Aggregate Admins (Emails per org)
    const adminStats = await User.aggregate([
      { $match: { role: "admin", orgName: { $exists: true, $ne: null } } },
      { $group: { _id: "$orgName", emails: { $addToSet: "$email" } } }
    ]);

    // 4. Merge Data for Unique Participant Count
    const statsMap = {};

    const getOrg = (name) => {
      if (!statsMap[name]) statsMap[name] = { orgName: name, emailSet: new Set(), completed: 0 };
      return statsMap[name];
    };

    // Add Invites
    inviteStats.forEach(i => {
      if (!i._id) return;
      const org = getOrg(i._id);
      if (i.emails && Array.isArray(i.emails)) {
        i.emails.forEach(e => e && org.emailSet.add(e.toLowerCase()));
      }
    });

    // Add Admins
    adminStats.forEach(a => {
      if (!a._id) return;
      const org = getOrg(a._id);
      if (a.emails && Array.isArray(a.emails)) {
        a.emails.forEach(e => e && org.emailSet.add(e.toLowerCase()));
      }
    });

    // Add Assessments
    assessmentStats.forEach(a => {
      if (!a._id) return;
      const org = getOrg(a._id);
      org.completed = a.completedCount;
    });

    // Transform to final array
    const result = Object.values(statsMap).map(org => ({
      orgName: org.orgName,
      users: org.emailSet.size, // Unique count
      completed: org.completed
    })).sort((a, b) => b.completed - a.completed);

    res.status(200).json(result);
  } catch (error) {
    console.error("Super Admin Stats Error:", error);
    res.status(500).json({ message: "Error fetching stats" });
  }
};

/**
 * GET SUPER ADMIN INTELLIGENCE (Advanced Dashboard Data)
 */
export const getSuperAdminIntelligence = async (req, res) => {
  try {
    const { quarter, year: queryYear } = req.query;
    const now = new Date();
    const selectedYear = queryYear ? parseInt(queryYear) : now.getFullYear();
    const selectedQuarter = quarter ? parseInt(quarter) : Math.floor(now.getMonth() / 3) + 1;

    const cycleMap = {
      1: { start: new Date(selectedYear, 0, 1), end: new Date(selectedYear, 2, 31, 23, 59, 59), label: "Q1" },
      2: { start: new Date(selectedYear, 3, 1), end: new Date(selectedYear, 5, 30, 23, 59, 59), label: "Q2" },
      3: { start: new Date(selectedYear, 6, 1), end: new Date(selectedYear, 8, 30, 23, 59, 59), label: "Q3" },
      4: { start: new Date(selectedYear, 9, 1), end: new Date(selectedYear, 11, 31, 23, 59, 59), label: "Q4" },
    };

    const period = cycleMap[selectedQuarter];
    const dateFilter = { createdAt: { $gte: period.start, $lte: period.end } };
    const assessmentDateFilter = { submittedAt: { $gte: period.start, $lte: period.end } };

    // 1. Unified Organization Counting
    const orgsFromInvites = await Invitation.distinct("orgName", dateFilter);
    const orgsFromAdmins = await User.distinct("orgName", { role: "admin", ...dateFilter });
    const orgsFromAssessments = await Assessment.distinct("orgName", assessmentDateFilter);

    const allOrgNames = new Set([
      ...orgsFromInvites,
      ...orgsFromAdmins,
      ...orgsFromAssessments
    ].filter(name => name && typeof name === "string"));

    const totalOrgs = allOrgNames.size;

    // Organization Health: Orgs with at least one completed assessment
    const activeOrgCount = await Assessment.distinct("orgName", { isCompleted: true, ...assessmentDateFilter });
    const healthRate = totalOrgs > 0 ? Math.round((activeOrgCount.length / totalOrgs) * 100) : 0;

    // 2. User Breakdown by Role (EXCLUDING superAdmin)
    const usersByRole = await User.aggregate([
      { $match: { ...dateFilter, role: { $ne: "superAdmin" } } },
      { $group: { _id: "$role", count: { $sum: 1 } } }
    ]);

    const employeeEmails = new Set();
    const employeeInvites = await Invitation.find({ role: "employee", ...dateFilter }, "email").lean();
    const employeeAssessments = await Assessment.find({
      "userDetails.role": { $regex: /employee/i },
      ...assessmentDateFilter
    }, "userDetails.email").lean();

    employeeInvites.forEach(i => i.email && employeeEmails.add(i.email.toLowerCase()));
    employeeAssessments.forEach(a => a.userDetails?.email && employeeEmails.add(a.userDetails.email.toLowerCase()));

    const roleStats = {
      admin: usersByRole.find(r => r._id === "admin")?.count || 0,
      manager: usersByRole.find(r => r._id === "manager")?.count || 0,
      leader: usersByRole.find(r => r._id === "leader")?.count || 0,
      employee: employeeEmails.size > 0 ? employeeEmails.size : (usersByRole.find(r => r._id === "employee")?.count || 0),
    };
    const totalUsers = Object.values(roleStats).reduce((a, b) => a + b, 0);

    // 3. Absolute Participation Totals (EXCLUDING superAdmin)
    // SuperAdmins don't take assessments, so we don't count them in totalAssigned
    const totalAssigned = await Invitation.countDocuments(dateFilter) + await User.countDocuments({ role: "admin", ...dateFilter });
    const totalCompleted = await Assessment.countDocuments({ isCompleted: true, ...assessmentDateFilter });
    const totalPending = totalAssigned > totalCompleted ? totalAssigned - totalCompleted : 0;

    // 4. Completion status by role
    const completionByRole = await Assessment.aggregate([
      { $match: { isCompleted: true, ...assessmentDateFilter } },
      { $group: { _id: "$userDetails.role", count: { $sum: 1 } } }
    ]);

    const roleCompletionRates = {
      admin: roleStats.admin > 0 ? Math.round(((completionByRole.find(r => r._id?.toLowerCase() === "admin")?.count || 0) / roleStats.admin) * 100) : 0,
      manager: roleStats.manager > 0 ? Math.round(((completionByRole.find(r => r._id?.toLowerCase() === "manager")?.count || 0) / roleStats.manager) * 100) : 0,
      leader: roleStats.leader > 0 ? Math.round(((completionByRole.find(r => r._id?.toLowerCase() === "leader")?.count || 0) / roleStats.leader) * 100) : 0,
      employee: roleStats.employee > 0 ? Math.round(((completionByRole.find(r => r._id?.toLowerCase() === "employee")?.count || 0) / roleStats.employee) * 100) : 0,
    };

    // 5. Recent Activity
    const activity = [
      ...(await Assessment.find({ isCompleted: true, ...assessmentDateFilter }).sort({ submittedAt: -1 }).limit(3).lean()).map(a => ({
        id: a._id,
        org: a.orgName || "Direct User",
        action: "Assessment Completed",
        time: a.submittedAt,
        type: "submission",
        status: "Success"
      })),
      ...(await Invitation.find(dateFilter).sort({ createdAt: -1 }).limit(3).lean()).map(i => ({
        id: i._id,
        org: i.orgName || "External",
        action: `Invite Sent to ${i.name || i.email}`,
        time: i.createdAt,
        type: "invitation",
        status: "Success"
      }))
    ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5);

    // 6. Current Cycle Info
    const currentCycle = {
      label: `${period.label} ${selectedYear} Growth Cycle`,
      period: `${period.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${period.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      daysLeft: Math.max(0, Math.ceil((period.end - now) / (1000 * 60 * 60 * 24))),
      healthRate
    };

    res.status(200).json({
      stats: [
        { label: "Onboarded Organizations", value: totalOrgs, icon: "solar:buildings-2-bold-duotone", color: "#448CD2", growth: "+4%", path: "/dashboard/org-assessments" },
        { label: "Client Base Users", value: totalUsers, icon: "solar:users-group-rounded-bold-duotone", color: "#8E54E9", growth: "+12%", path: "/dashboard/users" },
        { label: "Verified Assessments", value: totalCompleted, icon: "solar:checklist-minimalistic-bold-duotone", color: "#4776E6", growth: "+18%", path: "/dashboard/assessment-history" },
        { label: "Onboarding Health", value: `${healthRate}%`, icon: "solar:shield-check-bold-duotone", color: "#10b981", growth: "Stable", path: "/dashboard/org-assessments" },
      ],
      userBreakdown: roleStats,
      participation: {
        assigned: totalAssigned,
        completed: totalCompleted,
        pending: totalPending,
        rate: totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 0
      },
      completionByRole: roleCompletionRates,
      recentActivities: activity,
      currentCycle
    });
  } catch (error) {
    console.error("Super Admin Intelligence Error:", error);
    res.status(500).json({ message: "Error fetching intelligence data" });
  }
};