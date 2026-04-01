import User from "../models/user.model.js";
import Invitation from "../models/invitation.model.js";
import Assessment from "../models/assessment.model.js";
import { sendInvitationEmail } from "../utils/sendEmail.js";
import jwt from "jsonwebtoken";
import { createNotification, notifyHierarchy } from "../utils/notification.utils.js";
import fs from "fs";
import csv from "csv-parser";

// ================= Email Format Validation =================
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// ================= Send Invitation =================
export const sendInvitation = async (req, res) => {
    try {
        console.log(">>> [SERVER RECEIVED INVITE REQ]:", JSON.stringify(req.body, null, 2));
        let { email, role } = req.body;

        if (!email || !role) {
            return res.status(400).json({ message: "Email and role are required" });
        }

        email = email.trim().toLowerCase();

        if (!EMAIL_REGEX.test(email)) {
            return res.status(400).json({ message: "Invalid email address format" });
        }

        const inviterId = req.user.userId;

        // --- OPTIMIZATION: Parallelize all checks ---
        const [inviter, existingUser, existingInvite] = await Promise.all([
            User.findById(inviterId).select("role orgName adminId department").lean(),
            User.findOne({ email }).select("_id").lean(),
            Invitation.findOne({ email, used: false }).lean()
        ]);

        if (!inviter) {
            return res.status(404).json({ message: "Inviter not found" });
        }

        if (existingUser) {
            return res.status(400).json({ message: "User with this email already exists" });
        }

        // --- HIERARCHY CHECK ---
        const inviterRole = inviter.role?.toLowerCase();
        const targetRole = role.toLowerCase();
        const rolePermissions = {
            superadmin: ["admin"],
            admin: ["leader", "manager", "employee"]
        };

        if (!rolePermissions[inviterRole]?.includes(targetRole)) {
            return res.status(403).json({
                message: `As a ${inviterRole}, you cannot invite a ${targetRole}.`
            });
        }

        if (existingInvite) {
            const isExpired = new Date(existingInvite.expiredAt) < new Date();
            if (!isExpired) {
                return res.status(400).json({ message: "A pending invitation already exists for this email." });
            }
            await Invitation.deleteOne({ _id: existingInvite._id });
        }

        // --- PREPARE TOKEN & EXPIRY ---
        const isEmployee = targetRole === "employee";
        const tokenExpiry = isEmployee ? "7d" : "1h";
        const dbExpiry = isEmployee
            ? Date.now() + 3 * 24 * 60 * 60 * 1000
            : Date.now() + 60 * 60 * 1000;

        const token = jwt.sign(
            { email, role, invitedId: inviterId, orgName: inviter.orgName },
            process.env.JWT_SECRET,
            { expiresIn: tokenExpiry }
        );

        const invitation = new Invitation({
            email,
            role,
            token,
            token1: token,
            invitedBy: inviterId,
            adminId: inviter.adminId || inviterId,
            orgName: inviter.orgName,
            department: inviter.department || null,
            expiredAt: dbExpiry,
        });

        await invitation.save();

        const backendUrl = process.env.BACKEND_URL || "";
        const baseUrl = backendUrl.endsWith("/") ? backendUrl : `${backendUrl}/`;
        const link = `${baseUrl}auth/invite/${token}`;

        // --- SEND EMAIL WITH ROLLBACK ---
        try {
            await sendInvitationEmail(email, link, role, inviter.orgName);
        } catch (emailError) {
            console.error(">>> [EMAIL SEND FAIL] Rolling back invitation:", emailError.message);
            await Invitation.deleteOne({ _id: invitation._id });
            return res.status(500).json({
                message: "Failed to send invitation email. Please check your configuration."
            });
        }

        // --- HIERARCHICAL NOTIFICATION ---
        notifyHierarchy({
            initiatorId: inviterId,
            title: "Invitation Sent",
            message: `${inviter.firstName || inviter.email} has invited ${email} as ${role} for ${inviter.orgName}.`,
            type: "info"
        }).catch(err => console.error("[Hierarchy Notification Error]", err));

        res.status(200).json({ message: "Invitation sent successfully" });

    } catch (error) {
        console.error("Send invitation error:", error);
        res.status(500).json({ message: "Server error: " + error.message });
    }
};

// ==================== AcceptInvitation ====================
export const acceptInvitation = async (req, res) => {
    try {
        const { token } = req.params;

        const invitation = await Invitation.findOne({
            $or: [{ token: token }, { token1: token }],
        }).select("role used expiredAt").lean();

        if (!invitation) {
            return res.redirect(`${process.env.FRONTEND_URL}/login?error=invalid_token`);
        }

        if (invitation.used) {
            return res.redirect(`${process.env.FRONTEND_URL}/login?error=already_used`);
        }

        if (new Date(invitation.expiredAt) < new Date()) {
            return res.redirect(`${process.env.FRONTEND_URL}/login?error=expired_token`);
        }

        const frontendUrl = (process.env.FRONTEND_URL || "").endsWith("/")
            ? (process.env.FRONTEND_URL || "").slice(0, -1)
            : (process.env.FRONTEND_URL || "");

        // ✅ EMPLOYEE: Skip registration, go straight to assessment
        if (invitation.role === "employee") {
            return res.redirect(`${frontendUrl}/start-assessment?token=${token}`);
        }

        // ✅ ADMIN / LEADER / MANAGER: Set cookie and redirect to register
        const isProduction = process.env.NODE_ENV === "production";
        res.cookie("invitationToken", token, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax",
            maxAge: 60 * 60 * 1000,
            path: "/"
        });

        res.redirect(`${frontendUrl}/register?token=${token}`);
    } catch (error) {
        console.error("Accept invitation error:", error);
        const fallbackUrl = process.env.FRONTEND_URL || "";
        res.redirect(`${fallbackUrl}/login`);
    }
};

// ==================== Get Invitation Details (for Register Page) ====================
export const getInvitationDetails = async (req, res) => {
    try {
        const { token } = req.params;

        const invitation = await Invitation.findOne({
            $or: [{ token: token }, { token1: token }],
        }).select("email role orgName used expiredAt").lean();

        if (!invitation) {
            return res.status(404).json({ message: "Invitation not found" });
        }

        if (invitation.used) {
            return res.status(400).json({ message: "Invitation already used" });
        }

        if (new Date(invitation.expiredAt) < new Date()) {
            return res.status(400).json({ message: "Invitation expired" });
        }

        res.status(200).json({
            email: invitation.email,
            role: invitation.role,
            orgName: invitation.orgName
        });
    } catch (error) {
        console.error("Get invitation details error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// ==================== Get Invitations ====================
export const getInvitations = async (req, res) => {
    try {
        if (!req.user || !req.user.role) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const role = req.user.role.toLowerCase();
        const userOrg = req.user.orgName;
        const userId = req.user.userId;

        if (role === "superadmin") {
            const orgStats = await Invitation.aggregate([
                { $match: { role: "admin" } },
                {
                    $group: {
                        _id: "$email",
                        orgNameFromInvite: { $first: "$orgName" },
                        createdAt: { $first: "$createdAt" },
                        status: { $first: "$used" },
                        expiredAt: { $first: "$expiredAt" }
                    }
                },
                { $sort: { createdAt: -1 } }
            ]);

            const adminEmails = orgStats.map(item => item._id);
            const users = await User.find({ email: { $in: adminEmails } }).select("email orgName").lean();

            const userMap = {};
            users.forEach(u => { userMap[u.email.toLowerCase()] = u; });

            const finalOrgNames = orgStats.map(item => {
                const adminUser = userMap[item._id.toLowerCase()];
                return adminUser?.orgName || item.orgNameFromInvite || "Pending Setup";
            });

            const uniqueOrgNames = [...new Set(finalOrgNames)];

            const allCounts = await Invitation.aggregate([
                { $match: { orgName: { $in: uniqueOrgNames } } },
                { $group: { _id: "$orgName", count: { $sum: 1 } } }
            ]);

            const countMap = {};
            allCounts.forEach(c => { countMap[c._id] = c.count; });

            const formattedData = orgStats.map((item) => {
                const adminUser = userMap[item._id.toLowerCase()];
                const finalOrgName = adminUser?.orgName || item.orgNameFromInvite || "Pending Setup";

                let currentStatus = item.status ? "Accept" :
                    (item.expiredAt && new Date(item.expiredAt) < new Date() ? "Expire" : "Pending");

                return {
                    _id: item._id,
                    orgName: finalOrgName,
                    email: item._id,
                    createdAt: item.createdAt,
                    totalUsers: countMap[finalOrgName] || 0,
                    status: currentStatus,
                    role: "admin"
                };
            });
            return res.status(200).json(formattedData);

        } else {
            const dept = req.user.department;
            const filter = { orgName: userOrg };

            if (role === "leader") {
                filter.role = { $in: ["manager", "employee"] };
                if (dept) filter.department = dept;
            } else if (role === "manager") {
                filter.role = "employee";
                if (dept) filter.department = dept;
            } else if (role !== "admin") {
                filter.invitedBy = userId;
            }

            const invitations = await Invitation.find(filter).sort({ createdAt: -1 }).lean();
            if (invitations.length === 0) return res.status(200).json([]);

            const emails = invitations.map(inv => inv.email.toLowerCase());
            const tokens = invitations.flatMap(inv => [inv.token, inv.token1]).filter(Boolean);
            const invIds = invitations.map(inv => inv._id);

            const [registeredUsers, assessments] = await Promise.all([
                User.find({
                    $or: [
                        { invitationToken: { $in: tokens } },
                        { email: { $in: emails } }
                    ]
                }).select("email invitationToken firstName lastName department").lean(),
                Assessment.find({ invitationId: { $in: invIds } }).select("invitationId userDetails").lean()
            ]);

            const userMap = {};
            registeredUsers.forEach(u => {
                if (u.invitationToken) userMap[u.invitationToken] = u;
                if (u.email) userMap[u.email.toLowerCase()] = u;
            });

            const assessmentMap = {};
            assessments.forEach(a => {
                if (a.invitationId) assessmentMap[a.invitationId.toString()] = a;
            });

            const now = new Date();
            const formattedData = invitations.map((inv) => {
                const regUser = userMap[inv.token1] || userMap[inv.token] || userMap[inv.email.toLowerCase()];

                if ((role === "leader" || role === "manager") && dept) {
                    if (regUser && regUser.department && regUser.department !== dept) return null;
                }

                let name = "—";
                const currentStatus = inv.used ? "Accept" : (new Date(inv.expiredAt) < now ? "Expire" : "Pending");

                if (regUser) {
                    name = `${regUser.firstName || ""} ${regUser.lastName || ""}`.trim() || "Registered (Pending Info)";
                } else {
                    const assessment = assessmentMap[inv._id.toString()];
                    if (assessment?.userDetails) {
                        name = `${assessment.userDetails.firstName || ""} ${assessment.userDetails.lastName || ""}`.trim() || "Completed (Anonymous)";
                    }
                }

                return {
                    _id: inv._id,
                    name,
                    email: inv.email,
                    role: inv.role,
                    department: (regUser && regUser.department) || inv.department || "—",
                    createdAt: inv.createdAt,
                    status: currentStatus
                };
            }).filter(Boolean);

            return res.status(200).json(formattedData);
        }
    } catch (error) {
        console.error("Get invitations error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const deleteInvitation = async (req, res) => {
    const { id } = req.params;

    try {
        const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { email: id };
        const invites = await Invitation.find(query);

        if (invites.length === 0) {
            return res.status(404).json({ message: "No records found to delete" });
        }

        const canDelete = invites.every(inv => {
            const isExpired = inv.expiredAt && new Date(inv.expiredAt) < new Date();
            return isExpired && !inv.used;
        });

        if (!canDelete) {
            return res.status(400).json({
                message: "Only expired invitations can be deleted. Accepted or Pending invites must remain."
            });
        }

        await Invitation.deleteMany(query);

        res.status(200).json({ message: "Expired invitation deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete" });
    }
};

export const createAndSendInvite = async (email, role, inviter, department) => {
    if (!EMAIL_REGEX.test(email)) throw new Error("INVALID_EMAIL");

    const existingUser = await User.findOne({ email });
    if (existingUser) throw new Error("USER_EXISTS");

    const existingInvite = await Invitation.findOne({ email, used: false });
    if (existingInvite) throw new Error("ALREADY_INVITED");

    const token = jwt.sign(
        {
            email,
            role,
            invitedId: inviter._id,
            orgName: inviter.orgName
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );

    const invitation = new Invitation({
        email,
        role,
        token,
        token1: token,
        adminId: inviter.adminId || inviter._id,
        invitedBy: inviter._id,
        orgName: inviter.orgName,
        department: department || inviter.department || null,
        expiredAt: Date.now() + 60 * 60 * 1000,
    });

    await invitation.save();

    const backendUrl = process.env.BACKEND_URL || "";
    const baseUrl = backendUrl.endsWith("/")
        ? backendUrl
        : `${backendUrl}/`;

    const link = `${baseUrl}auth/invite/${token}`;

    await sendInvitationEmail(email, link, role, inviter.orgName);
};

export const sendBulkInvitations = async (req, res) => {
    try {
        const { userId, role: inviterRole } = req.user;
        if (!req.file) return res.status(400).json({ message: "CSV file is required" });

        const inviter = await User.findById(userId).select("role orgName adminId department").lean();
        if (!inviter) {
            if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            return res.status(404).json({ message: "Inviter not found" });
        }

        const rawInvitations = [];
        const failed = [];
        const allowedRoles = inviterRole.toLowerCase() === "superadmin" ? ["admin"] : ["leader", "manager", "employee"];
        const getVal = (r, keys) => {
            const found = Object.keys(r).find(k => keys.includes(k.toLowerCase()));
            return found ? r[found] : null;
        };

        // Parse CSV
        await new Promise((resolve, reject) => {
            fs.createReadStream(req.file.path)
                .pipe(csv())
                .on("data", row => {
                    const email = getVal(row, ["email", "e-mail", "mail"])?.trim().toLowerCase();
                    const role = getVal(row, ["role", "type"])?.trim().toLowerCase();
                    const department = getVal(row, ["department", "dept"])?.trim();
                    if (email && role) rawInvitations.push({ email, role, department });
                    else failed.push({ email: email || "missing", reason: `Missing ${!email ? 'email' : 'role'}` });
                })
                .on("end", resolve)
                .on("error", reject);
        });

        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

        if (rawInvitations.length === 0) {
            return res.status(400).json({ message: "No valid invitations found in CSV.", failed });
        }

        // --- BATCH PROCESS ---
        const emails = rawInvitations.map(i => i.email);
        const [existingUsers, existingInvites] = await Promise.all([
            User.find({ email: { $in: emails } }).select("email").lean(),
            Invitation.find({ email: { $in: emails }, used: false }).select("email").lean()
        ]);

        const existingUserEmails = new Set(existingUsers.map(u => u.email.toLowerCase()));
        const existingInviteEmails = new Set(existingInvites.map(i => i.email.toLowerCase()));

        const rolePermissions = {
            superadmin: ["admin"],
            admin: ["leader", "manager", "employee"]
        };

        let successCount = 0;
        const processInvitations = rawInvitations.map(async ({ email, role, department }) => {
            try {
                if (!allowedRoles.includes(role) || !rolePermissions[inviterRole.toLowerCase()]?.includes(role)) {
                    failed.push({ email, reason: "Permission denied or invalid role" });
                    return;
                }
                if (existingUserEmails.has(email)) {
                    failed.push({ email, reason: "Already registered" });
                    return;
                }
                if (existingInviteEmails.has(email)) {
                    failed.push({ email, reason: "Pending invite exists" });
                    return;
                }

                await createAndSendInvite(email, role, inviter, department);
                successCount++;
            } catch (err) {
                failed.push({ email, reason: err.message || "Failed" });
            }
        });

        // Use Promise.all with chunks or parallel if small enough
        await Promise.all(processInvitations);

        res.json({ success: successCount, failedCount: failed.length, failed });

    } catch (err) {
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ message: "Bulk invite failed", error: err.message });
    }
};
