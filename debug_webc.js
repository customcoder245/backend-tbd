import mongoose from 'mongoose';
import User from './src/models/user.model.js';
import SubmittedAssessment from './src/models/submittedAssessment.model.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URL);
  try {
    const orgName = "WEBC";
    const orgRegex = new RegExp(`^\\s*${orgName}\\s*$`, 'i');

    console.log("--- DEBUGGING WEBC DATABASE STATUS ---");
    
    const allUsers = await User.find({ orgName: orgRegex }).lean();
    console.log(`\nTotal Users found for ${orgName}: ${allUsers.length}`);
    allUsers.forEach(u => {
      console.log(`User: ${u.firstName} ${u.lastName} | Email: ${u.email} | Role: ${u.role} | Department: ${u.department}`);
    });

    const ALLOWED_ROLES = ["leader", "manager", "employee"];
    const orgUsers = allUsers.filter(u => ALLOWED_ROLES.includes((u.role || "").toLowerCase()));
    console.log(`Allowed Users (leader/manager/employee): ${orgUsers.length}`);

    const userIds = orgUsers.map(u => u._id);
    const userEmails = orgUsers.map(u => (u.email || "").toLowerCase().trim()).filter(Boolean);

    const adminUserIds = allUsers
      .filter(u => u.role === "admin" || u.role === "superAdmin")
      .map(u => u._id);

    const submittedOrConditions = [
      { "userDetails.orgName": orgRegex }
    ];
    if (userIds.length) {
      submittedOrConditions.push({ userId: { $in: userIds } });
    }
    if (userEmails.length) {
      submittedOrConditions.push({ "userDetails.email": { $in: userEmails } });
    }
    if (adminUserIds.length) {
      submittedOrConditions.push({ adminId: { $in: adminUserIds } });
    }

    const submittedDocs = await SubmittedAssessment.find({
      $or: submittedOrConditions,
      isDeleted: { $ne: true }
    }).lean();

    console.log(`\nTotal Submitted Assessments found: ${submittedDocs.length}`);
    submittedDocs.forEach(s => {
      const ud = s.userDetails || {};
      console.log(`Assessment ID: ${s._id} | User email: ${ud.email} | Role/Stakeholder: ${s.stakeholder || ud.role} | Department: ${ud.department}`);
    });

  } catch (err) {
    console.error("ERROR:", err);
  } finally {
    process.exit(0);
  }
}
run();
