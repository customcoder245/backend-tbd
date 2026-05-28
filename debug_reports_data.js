import mongoose from 'mongoose';
import User from './src/models/user.model.js';
import SubmittedAssessment from './src/models/submittedAssessment.model.js';
import dotenv from 'dotenv';
dotenv.config();

const getFullName = (first, last) => `${first || ""} ${last || ""}`.trim();

async function run() {
  await mongoose.connect(process.env.MONGODB_URL);
  try {
    const orgName = "WEBC";
    const orgRegex = new RegExp(`^\\s*${orgName}\\s*$`, 'i');

    const ALLOWED_ROLES = ["leader", "manager", "employee"];
    const isAllowedRole = (role) => {
      if (!role || role === "N/A") return true;
      return ALLOWED_ROLES.includes(role.toLowerCase());
    };

    const allOrgUsers = await User.find({ orgName: orgRegex }).lean();
    const orgUsers = allOrgUsers.filter(u => ALLOWED_ROLES.includes((u.role || "").toLowerCase()));

    const userIds = orgUsers.map(u => u._id);
    const userEmails = orgUsers.map(u => (u.email || "").toLowerCase().trim()).filter(Boolean);
    const adminUserIds = allOrgUsers
      .filter(u => u.role === "admin" || u.role === "superAdmin")
      .map(u => u._id);

    const submittedOrConditions = [{ "userDetails.orgName": orgRegex }];
    if (userIds.length) submittedOrConditions.push({ userId: { $in: userIds } });
    if (userEmails.length) submittedOrConditions.push({ "userDetails.email": { $in: userEmails } });
    if (adminUserIds.length) submittedOrConditions.push({ adminId: { $in: adminUserIds } });

    const submittedDocs = await SubmittedAssessment.find({
      $or: submittedOrConditions,
      isDeleted: { $ne: true }
    }).lean();

    const participantMap = new Map();

    const findParticipant = (email, userId) => {
      if (email && participantMap.has(email)) return participantMap.get(email);
      if (userId) {
        for (const [, p] of participantMap) {
          if (p.userId === userId) return p;
        }
      }
      return null;
    };

    submittedDocs.forEach(sub => {
      const userDetails = sub.userDetails || {};
      const email = (userDetails.email || "").toLowerCase().trim();
      const userId = sub.userId ? sub.userId.toString() : "";
      const role = sub.stakeholder || userDetails.role || "N/A";

      if (!isAllowedRole(role)) return;

      let existing = findParticipant(email, userId);

      if (existing) {
        const existingTime = existing.submittedAt ? new Date(existing.submittedAt).getTime() : 0;
        const newTime = sub.submittedAt ? new Date(sub.submittedAt).getTime() : 0;
        if (newTime >= existingTime) {
          existing.assessmentId = sub.assessmentId ? sub.assessmentId.toString() : (sub._id ? sub._id.toString() : "");
          existing.isCompleted = true;
          existing.submittedAt = sub.submittedAt || sub.createdAt;
          existing.responses = sub.responses || [];
          existing.scores = sub.scores || null;
          existing.stakeholder = sub.stakeholder || null;
          if (userDetails.firstName) {
            existing.empName = getFullName(userDetails.firstName, userDetails.lastName);
          }
          if (sub.stakeholder) existing.role = sub.stakeholder;
          else if (userDetails.role) existing.role = userDetails.role;
          if (userDetails.department) existing.dept = userDetails.department;
        }
      } else {
        const key = email || userId || sub._id.toString();
        participantMap.set(key, {
          assessmentId: sub.assessmentId ? sub.assessmentId.toString() : (sub._id ? sub._id.toString() : ""),
          userId: userId,
          empName: getFullName(userDetails.firstName, userDetails.lastName) || "Participant",
          email: email || "",
          role: role,
          dept: userDetails.department || "N/A",
          isCompleted: true,
          submittedAt: sub.submittedAt || sub.createdAt,
          responses: sub.responses || [],
          scores: sub.scores || null,
          stakeholder: sub.stakeholder || null
        });
      }
    });

    orgUsers.forEach(u => {
      const email = (u.email || "").toLowerCase().trim();
      const userId = u._id.toString();
      const existing = findParticipant(email, userId);

      if (!existing) {
        const key = email || userId;
        participantMap.set(key, {
          assessmentId: "",
          userId: userId,
          empName: getFullName(u.firstName, u.lastName) || "Participant",
          email: u.email || "",
          role: u.role || "N/A",
          dept: u.department || "N/A",
          isCompleted: false,
          submittedAt: null,
          responses: [],
          scores: null,
          stakeholder: null
        });
      }
    });

    const reportsData = Array.from(participantMap.values());

    console.log("\n--- REPORTS DATA BEFORE NORMALIZATION ---");
    reportsData.forEach(r => {
      console.log(`Name: ${r.empName} | Email: ${r.email} | Role: ${r.role} | Dept: ${r.dept}`);
    });

    const toTitleCase = (str) => {
      if (!str) return "";
      const s = String(str).trim();
      if (!s || s.toLowerCase() === "n/a") return "N/A";
      return s.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
    };

    reportsData.forEach(r => {
      r.role = toTitleCase(r.role);
      r.dept = toTitleCase(r.dept);
    });

    console.log("\n--- REPORTS DATA AFTER NORMALIZATION ---");
    reportsData.forEach(r => {
      console.log(`Name: ${r.empName} | Email: ${r.email} | Role: ${r.role} | Dept: ${r.dept}`);
    });

    const uniqueRoles = [...new Set(reportsData.map(r => r.role).filter(Boolean))];
    console.log("\nUnique Roles:", uniqueRoles);

  } catch (err) {
    console.error("ERROR:", err);
  } finally {
    process.exit(0);
  }
}
run();
