import Assessment from "../models/assessment.model.js";
import User from "../models/user.model.js";
import SubmittedAssessment from "../models/submittedAssessment.model.js";
import Response from "../models/response.model.js";
import mongoose from "mongoose";
import { createNotification, notifySuperAdmins, notifyOrgAdmins } from "../utils/notification.utils.js";
import Invitation from "../models/invitation.model.js";
import { ASSESSMENT_CYCLE_MONTHS, getAssessmentCycleStartDate } from "../config/assessment.config.js";
import { calculateAssessmentScores } from "../utils/scoring.utils.js";
import { getSubdomainFeedback } from "../utils/feedback.utils.js";


/**
 * START ASSESSMENT
 * Creates draft assessment
 */
export const startAssessment = async (req, res) => {
  try {
    const { stakeholder } = req.body;
    const userId = req.user?.userId;

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

    // 🚫 Super Admins are not permitted to take assessments
    if (user.role === "superAdmin") {
      return res.status(403).json({ message: "Super Admins are not permitted to take assessments." });
    }

    // 2. Check the latest COMPLETED assessment first (determines the cycle)
    const latestCompletedAssessment = await Assessment.findOne({
      userId,
      isCompleted: true
    }).sort({ submittedAt: -1 });

    const cycleStart = getAssessmentCycleStartDate();
    const cycleIsActive = latestCompletedAssessment &&
      latestCompletedAssessment.submittedAt &&
      new Date(latestCompletedAssessment.submittedAt).getTime() > cycleStart.getTime();

    // 3. If cycle is still active (not yet due), block the user
    if (cycleIsActive) {
      const subAt = new Date(latestCompletedAssessment.submittedAt);
      const monthsToAdd = Number(ASSESSMENT_CYCLE_MONTHS) || 3;
      const nextDate = new Date(subAt);
      nextDate.setMonth(nextDate.getMonth() + monthsToAdd);

      const diffTime = Math.max(0, nextDate.getTime() - Date.now());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return res.status(403).json({
        message: `Assessment not due yet. Next available in ${diffDays} day(s).`
      });
    }

    // 4. Cycle is due (or never completed). Check for an in-progress assessment.
    const incompleteAssessment = await Assessment.findOne({
      userId,
      isCompleted: false
    }).sort({ createdAt: -1 });

    if (incompleteAssessment) {
      const latestSubAt = latestCompletedAssessment?.submittedAt ? new Date(latestCompletedAssessment.submittedAt).getTime() : 0;
      const incompleteCreatedDate = incompleteAssessment.createdAt ? new Date(incompleteAssessment.createdAt).getTime() : 0;

      const isFromCurrentCycle = incompleteCreatedDate > latestSubAt;

      if (isFromCurrentCycle) {
        return res.status(200).json({
          message: "Resuming existing assessment",
          assessmentId: incompleteAssessment._id
        });
      } else {
        // Stale leftover — delete it so we can start fresh
        await Assessment.deleteOne({ _id: incompleteAssessment._id });
      }
    }

    // 5. Create a fresh assessment
    const invitation = await Invitation.findOne({ email: user.email }).sort({ createdAt: -1 });

    const assessmentData = {
      stakeholder,
      userId: user._id,
      invitationId: invitation ? invitation._id : null,
      invitedBy: invitation?.invitedBy || user.adminId,
      orgName: user.orgName || invitation?.orgName,
      employeeEmail: user.email,
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
    console.error("DEBUG: Error starting assessment:", error);
    res.status(500).json({
      message: "Error starting assessment",
      error: error.message,
      stack: error.stack
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
    const { firstName, lastName, department } = req.body;

    console.log(`[Assessment Submission] Attempting to submit assessment ${assessmentId} by user ${userId}`);

    // Update User Profile with provided data (if any)
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (department) user.department = department;
    // We will save later after scores are calculated

    const assessmentObjectId = new mongoose.Types.ObjectId(assessmentId);

    // 1️⃣ Fetch assessment
    const assessment = await Assessment.findById(assessmentObjectId);
    if (!assessment) {
      console.warn(`[Assessment Submission] Assessment ${assessmentId} not found.`);
      return res.status(404).json({ message: "Assessment not found" });
    }

    if (assessment.isCompleted) {
      console.warn(`[Assessment Submission] Assessment ${assessmentId} already submitted.`);
      return res.status(400).json({ message: "Assessment already submitted" });
    }

    // 2️⃣ Fetch responses (JOIN)
    const responses = await Response.find({ assessmentId: assessmentObjectId });

    if (!responses || responses.length === 0) {
      console.warn(`[Assessment Submission] No responses found for assessment ${assessmentId}.`);
      return res.status(400).json({ message: "No responses provided" });
    }
    console.log(`[Assessment Submission] Found ${responses.length} responses for assessment ${assessmentId}.`);

    const fullResponses = responses.map(r => {
      const obj = r.toObject();
      delete obj.__v;
      return obj;
    });

    // 3️⃣ Reuse user for snapshot
    const userObj = user.toObject();
    console.log(`[Assessment Submission] User ${userObj.email} found for assessment ${assessmentId}.`);

    const cleanedUserDetails = {
      _id: userObj._id,
      firstName: userObj.firstName,
      lastName: userObj.lastName,
      email: userObj.email,
      department: userObj.department,
      role: userObj.role,
      orgName: userObj.orgName
    };

    // 4️⃣ Mark assessment completed
    assessment.isCompleted = true;
    assessment.submittedAt = new Date();
    assessment.userId = userId;
    assessment.userDetails = cleanedUserDetails;

    // 🏆 Calculate scores (Phase 1 Logic)
    const { scores, classification } = calculateAssessmentScores(responses);
    console.log(`[Assessment Submission] Scores calculated for assessment ${assessmentId}. Classification: ${classification}`);

    // 💡 Add feedback BEFORE assigning to model
    let fbCount = 0;
    const stakeholderRole = assessment.stakeholder || user.role || "employee";

    for (const domainName in scores.domains) {
      const domainObj = scores.domains[domainName];
      domainObj.subdomainFeedback = {};
      domainObj.feedback = null; // Default

      let minScore = 200; // Value higher than max possible score
      let minSubName = null;

      for (const subName in domainObj.subdomains) {
        const subScore = domainObj.subdomains[subName];

        // Find LOWEST subdomain for domain-level insight
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
    console.log(`[Assessment Submission] Attached subdomain feedback. Total sub-feedbacks: ${fbCount}. Role: ${stakeholderRole}`);

    // 🔥 4.5 Link to User record for easier access from dashboard
    user.lastAssessmentScore = scores.overall;
    user.lastAssessmentClassification = classification;


    // Assign the fully-built scores object (with feedback already included)
    assessment.scores = scores;
    assessment.classification = classification;

    // ⚠️ Tell Mongoose the nested Map changed so it persists correctly
    assessment.markModified('scores');

    // 🔥 5️⃣ SAVE ASSESSMENT & SNAPSHOT & USER (In parallel for speed)
    const [savedAssessment, submittedAssessment, savedUser] = await Promise.all([
      assessment.save(),
      SubmittedAssessment.create({
        assessmentId: assessment._id,
        stakeholder: assessment.stakeholder,
        userId,
        userDetails: cleanedUserDetails,
        responses: fullResponses,
        scores,
        classification,
        submittedAt: new Date()
      }),
      user.save()
    ]);
    console.log(`[Assessment Submission] Assessment ${assessmentId} saved and snapshot created. Linked to userId: ${userId}`);

    // --- DYNAMIC NOTIFICATIONS (Fire & Forget to make API fast) ---
    // 1. Notify the user
    createNotification({
      recipient: userId,
      title: "Assessment Submitted",
      message: "Your assessment has been successfully submitted.",
      type: "success"
    }).catch(err => console.error("[Notification Error]", err));

    // 2. Notify their Organization Admins
    if (user.orgName) {
      notifyOrgAdmins({
        orgName: user.orgName,
        title: "Assessment Completed",
        message: `${user.firstName} ${user.lastName} (${user.role}) has completed the assessment.`,
        type: "success",
        excludeUser: userId
      }).catch(err => console.error("[Org Admin Notification Error]", err));
    }

    // 3. Notify Super Admins
    notifySuperAdmins({
      title: "New Assessment Activity",
      message: `${user.firstName} ${user.lastName} from ${user.orgName || "Unknown Org"} has submitted an assessment.`,
      type: "info",
      excludeUser: userId
    }).catch(err => console.error("[Super Admin Notification Error]", err));

    console.log(`[Assessment Submission] Triggered background notifications for assessment ${assessmentId}.`);

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

    // 3. Aggregate Users (Emails per org) - All roles
    const userStats = await User.aggregate([
      { $match: { orgName: { $exists: true, $ne: null } } },
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

    // Add Users
    userStats.forEach(a => {
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

    // 1. Run all independent queries in parallel for speed
    const [
      orgsFromInvites,
      orgsFromAdmins,
      orgsFromAssessments,
      activeOrgCount,
      usersByRole,
      employeeInvites,
      employeeAssessments,
      inviteCount,
      adminCount,
      totalCompleted,
      completionByRole,
      recentAssessments,
      recentInvites
    ] = await Promise.all([
      Invitation.distinct("orgName"),
      User.distinct("orgName"),
      Assessment.distinct("orgName"),
      Assessment.distinct("orgName", { isCompleted: true, ...assessmentDateFilter }),
      User.aggregate([
        { $match: { role: { $ne: "superAdmin" } } },
        { $group: { _id: "$role", count: { $sum: 1 } } }
      ]),
      Invitation.find({ role: "employee" }, "email").lean(),
      Assessment.find({
        "userDetails.role": { $regex: /employee/i }
      }, "userDetails.email").lean(),
      Invitation.countDocuments(),
      User.countDocuments({ role: "admin" }),
      Assessment.countDocuments({ isCompleted: true }),
      Assessment.aggregate([
        { $match: { isCompleted: true, ...assessmentDateFilter } },
        { $group: { _id: "$userDetails.role", count: { $sum: 1 } } }
      ]),
      Assessment.find({ isCompleted: true, ...assessmentDateFilter }).sort({ submittedAt: -1 }).limit(3).lean(),
      Invitation.find(dateFilter).sort({ createdAt: -1 }).limit(3).lean()
    ]);

    const allOrgNames = new Set([
      ...orgsFromInvites,
      ...orgsFromAdmins,
      ...orgsFromAssessments
    ].filter(name => name && typeof name === "string"));

    const totalOrgs = allOrgNames.size;
    const healthRate = totalOrgs > 0 ? Math.round((activeOrgCount.length / totalOrgs) * 100) : 0;

    const employeeEmails = new Set();
    employeeInvites.forEach(i => i.email && employeeEmails.add(i.email.toLowerCase()));
    employeeAssessments.forEach(a => a.userDetails?.email && employeeEmails.add(a.userDetails.email.toLowerCase()));

    const roleStats = {
      admin: usersByRole.find(r => r._id === "admin")?.count || 0,
      manager: usersByRole.find(r => r._id === "manager")?.count || 0,
      leader: usersByRole.find(r => r._id === "leader")?.count || 0,
      employee: employeeEmails.size > 0 ? employeeEmails.size : (usersByRole.find(r => r._id === "employee")?.count || 0),
    };
    const totalUsers = Object.values(roleStats).reduce((a, b) => a + b, 0);

    const totalAssigned = inviteCount + adminCount;
    const totalPending = totalAssigned > totalCompleted ? totalAssigned - totalCompleted : 0;

    const roleCompletionRates = {
      admin: roleStats.admin > 0 ? Math.round(((completionByRole.find(r => r._id?.toLowerCase() === "admin")?.count || 0) / roleStats.admin) * 100) : 0,
      manager: roleStats.manager > 0 ? Math.round(((completionByRole.find(r => r._id?.toLowerCase() === "manager")?.count || 0) / roleStats.manager) * 100) : 0,
      leader: roleStats.leader > 0 ? Math.round(((completionByRole.find(r => r._id?.toLowerCase() === "leader")?.count || 0) / roleStats.leader) * 100) : 0,
      employee: roleStats.employee > 0 ? Math.round(((completionByRole.find(r => r._id?.toLowerCase() === "employee")?.count || 0) / roleStats.employee) * 100) : 0,
    };

    // 5. Recent Activity
    const activity = [
      ...recentAssessments.map(a => ({
        id: a._id,
        org: a.orgName || "Direct User",
        action: "Assessment Completed",
        time: a.submittedAt,
        type: "submission",
        status: "Success"
      })),
      ...recentInvites.map(i => ({
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

    // 7. Dynamic AI Insights
    const aiInsights = [
      {
        title: "Platform Growth",
        desc: totalOrgs > 0
          ? `Currently managing ${totalOrgs} organizations with ${totalUsers} total users across all sectors.`
          : "Platform onboarding is ready for new organizations.",
        type: "positive",
      },
      {
        title: "Data Integrity",
        desc: healthRate > 80
          ? `High data integrity: ${healthRate}% of organizations have active, verified assessment cycles.`
          : `Data collection in progress: ${healthRate}% of organizations have completed recent assessments.`,
        type: "info",
      },
    ];

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
      currentCycle,
      aiInsights
    });
  } catch (error) {
    console.error("Super Admin Intelligence Error:", error);
    res.status(500).json({ message: "Error fetching intelligence data" });
  }
};

/**
 * GET ADMIN INTELLIGENCE (Organization Dashboard Data)
 */
export const getAdminIntelligence = async (req, res) => {
  try {
    const { orgName } = req.user;
    if (!orgName) {
      return res.status(400).json({ message: "Admin organization not found" });
    }

    const { range } = req.query;

    // --- DATE FILTERING LOGIC ---
    let dateFilter = {};
    const now = new Date();
    if (range === "This Week") {
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      startOfWeek.setHours(0, 0, 0, 0);
      dateFilter = { createdAt: { $gte: startOfWeek } };
    } else if (range === "This Month") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      dateFilter = { createdAt: { $gte: startOfMonth } };
    } else if (range === "Quarterly") {
      const currentQuarter = Math.floor(now.getMonth() / 3);
      const startOfQuarter = new Date(now.getFullYear(), currentQuarter * 3, 1);
      dateFilter = { createdAt: { $gte: startOfQuarter } };
    }

    const teamFilter = { orgName, role: { $ne: "admin" } };
    // Apply date filter to assessments
    const assessmentFilter = { orgName, ...dateFilter };

    // Run independent queries in parallel
    const [assessments, registeredUsers, activeInviteCount, recentInvites] = await Promise.all([
      Assessment.find(assessmentFilter).lean(),
      User.find(teamFilter).lean(),
      Invitation.countDocuments({ ...teamFilter, used: false }),
      Invitation.find({ ...teamFilter, ...dateFilter }).sort({ createdAt: -1 }).limit(5).lean()
    ]);

    // 3. Unique People Discovery
    const peopleMap = new Map();

    registeredUsers.forEach(u => {
      const email = u.email.toLowerCase();
      peopleMap.set(email, {
        email,
        name: u.firstName !== "-" ? `${u.firstName} ${u.lastName}` : u.email,
        role: u.role,
        status: "Registered",
        assessmentStatus: "Not Started",
        lastScore: u.lastAssessmentScore || 0,
        classification: u.lastAssessmentClassification || null
      });
    });

    assessments.forEach(a => {
      const email = a.employeeEmail?.toLowerCase() || a.userDetails?.email?.toLowerCase();
      if (!email) return;

      const existing = peopleMap.get(email);
      const name = a.userDetails?.firstName ? `${a.userDetails.firstName} ${a.userDetails.lastName}` : (existing?.name || email);

      peopleMap.set(email, {
        email,
        name,
        role: a.userDetails?.role || existing?.role || "Employee",
        status: a.isCompleted ? "Completed" : "Active",
        assessmentStatus: a.isCompleted ? "Completed" : "In Progress",
        lastActivity: a.submittedAt || a.updatedAt || a.createdAt,
        lastScore: a.isCompleted ? Math.round(a.scores?.overall || 0) : (existing?.lastScore || 0),
        classification: a.isCompleted ? a.classification : (existing?.classification || null)
      });
    });

    const uniquePeople = Array.from(peopleMap.values());
    const completedCount = uniquePeople.filter(p => p.assessmentStatus === "Completed").length;
    const inProgressCount = uniquePeople.filter(p => p.assessmentStatus === "In Progress").length;
    const notStartedCount = uniquePeople.filter(p => p.assessmentStatus === "Not Started").length;

    const participationRate = uniquePeople.length > 0 ? Math.round((completedCount / uniquePeople.length) * 100) : 0;

    const stats = {
      totalMembers: uniquePeople.length,
      activeInvites: activeInviteCount,
      completedAssessments: completedCount,
      inProgressAssessments: inProgressCount,
      notStartedAssessments: notStartedCount,
      participationRate: participationRate,
      completionRate: participationRate // Alias for frontend compatibility
    };

    // 4. Role Breakdown
    const roleStats = {
      manager: uniquePeople.filter(p => p.role?.toLowerCase() === "manager").length,
      leader: uniquePeople.filter(p => p.role?.toLowerCase() === "leader").length,
      employee: uniquePeople.filter(p => p.role?.toLowerCase() === "employee").length,
    };

    // 5. Activity Stream (Assessments + Invitations) - Weighted by Time Range
    const activityStream = [
      ...assessments.map(a => ({
        id: a._id,
        user: a.userDetails?.firstName ? `${a.userDetails.firstName} ${a.userDetails.lastName}` : a.employeeEmail,
        action: a.isCompleted ? "Completed assessment" : "Started assessment",
        time: a.submittedAt || a.createdAt,
        type: a.isCompleted ? "completion" : "start",
        role: a.userDetails?.role || "Participant"
      })),
      ...recentInvites.map(i => ({
        id: i._id,
        user: i.name || i.email,
        action: "Invitation sent",
        time: i.createdAt,
        type: "invitation",
        role: i.role
      }))
    ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5);

    // 6. Strategic Insight Logic
    let insight = "Assessment phase initiated. Encourage team members to participate for better organizational clarity.";
    if (participationRate > 75) {
      insight = "Excellent engagement! Your team shows strong 'Strategic Alignment'. Results indicate high readiness for growth.";
    } else if (participationRate > 40) {
      insight = "Steady progress. Early data suggests strength in 'Operational Flow'. Focus on remaining participants to reach critical mass.";
    }

    res.status(200).json({
      stats,
      roleBreakdown: roleStats,
      activityStream,
      orgName,
      people: uniquePeople,
      strategicInsight: insight
    });
  } catch (error) {
    console.error("Admin Intelligence Error:", error);
    res.status(500).json({ message: "Error fetching admin intelligence data" });
  }
};
