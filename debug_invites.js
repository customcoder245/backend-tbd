import mongoose from "mongoose";
import Invitation from "./src/models/invitation.model.js";
import User from "./src/models/user.model.js";

async function run() {
  await mongoose.connect("mongodb+srv://customcoder245_db_user:TLAvyyAhu5dwtuVT@cluster0.jjar4ht.mongodb.net/");
  
  const orgName = "WEBC";
  const escapedName = orgName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const orgRegex = new RegExp(`^\\s*${escapedName}\\s*$`, 'i');

  const teamFilter = { orgName: orgRegex, role: { $ne: "admin" } };
  
  const emails = await Invitation.distinct("email", { ...teamFilter, used: false, expiredAt: { $gte: new Date() }, isDeleted: { $ne: true } });
  
  const registered = await User.distinct("email", teamFilter);
  const regSet = new Set(registered.map(e => e.toLowerCase()));
  
  const activeEmails = emails.filter(e => !regSet.has(e.toLowerCase()));
  
  console.log("Total unique active emails matching filter:", activeEmails.length);
  console.log("Emails:", activeEmails);
  
  const rawInvitations = await Invitation.find({ ...teamFilter, used: false, expiredAt: { $gte: new Date() }, isDeleted: { $ne: true } }).lean();
  console.log("Raw invitations found:", rawInvitations.length);
  console.log(rawInvitations.map(i => ({ email: i.email, orgName: i.orgName, role: i.role, expiredAt: i.expiredAt })));
  
  mongoose.disconnect();
}

run();
