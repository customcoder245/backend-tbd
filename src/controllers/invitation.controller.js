import User from "../models/user.model.js";
import Invitation from "../models/invitation.model.js";
import Assessment from "../models/assessment.model.js";
import { sendInvitationEmail } from "../utils/sendEmail.js";
import jwt from "jsonwebtoken";
import { createNotification } from "../utils/notification.utils.js";
import fs from "fs";
import csv from "csv-parser";

// ================= Email Format Validation =================
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// ================= Send Invitation =================
export const sendInvitation = async (req, res) => {
    try {
        console.log(">>> [SERVER RECEIVED INVITE REQ]:", JSON.stringify(req.body, null, 2));
        let { email, role } = req.body;

        if (email && typeof email === "string") {
            email = email.trim().toLowerCase();
        }

        const inviterId = req.user.userId;

        if (!email || !role) {
            console.error(">>> [INVITE FAIL]: Missing email or role in request body", req.body);
            return res.status(400).json({ message: "Email and role are required" });
        }

        // --- EMAIL FORMAT VALIDATION ---
        if (!EMAIL_REGEX.test(email)) {
            return res.status(400).json({ message: "Invalid email address format" });
        }

        const inviter = await User.findById(inviterId);
        if (!inviter) {
            return res.status(404).json({ message: "Inviter not found" });
        }

        // --- HIERARCHY CHECK ---
        const inviterRole = inviter.role?.toLowerCase();
        const targetRole = role?.toLowerCase();

        if (inviterRole === "superadmin") {
            if (targetRole !== "admin") {
                return res.status(403).json({ message: "SuperAdmins can only invite Admins." });
            }
        } else if (inviterRole === "admin") {
            if (!["leader", "manager", "employee"].includes(targetRole)) {
                return res.status(403).json({ message: "Admins can only invite Leader, Manager, or Employee roles." });
            }
        } else if (inviterRole === "leader") {
            if (!["manager", "employee"].includes(targetRole)) {
                return res.status(403).json({ message: "Leaders can only invite Managers and Employees." });
            }
        } else if (inviterRole === "manager") {
            if (targetRole !== "employee") {
                return res.status(403).json({ message: "Managers can only invite Employees." });
            }
        } else {
            return res.status(403).json({ message: "You do not have permission to send invitations." });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User with this email already exists" });
        }

        const existingInvite = await Invitation.findOne({ email, used: false });
        if (existingInvite) {
            const isExpired = new Date(existingInvite.expiredAt) < new Date();
            if (!isExpired) {
                return res.status(400).json({ message: "A pending invitation already exists for this email." });
            }
            // If expired, remove it so we can create a fresh one
            await Invitation.deleteOne({ _id: existingInvite._id });
        }

        // Employees get 7 days (they take the assessment directly, no registration needed)
        // Admins/Leaders/Managers get 1 hour (they register quickly)
        const isEmployee = role === "employee";
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

        const baseUrl = process.env.BACKEND_URL.endsWith("/")
            ? process.env.BACKEND_URL
            : `${process.env.BACKEND_URL}/`;

        const link = `${baseUrl}auth/invite/${token}`;

        // Send the email — if this fails we ROLLBACK the saved invitation
        // so the user can retry without getting "already invited" errors
        try {
            await sendInvitationEmail(email, link, role, inviter.orgName);
        } catch (emailError) {
            console.error(">>> [EMAIL SEND FAIL] Rolling back invitation:", emailError.message);
            await Invitation.deleteOne({ _id: invitation._id });
            return res.status(500).json({
                message: "Failed to send invitation email. Please check your email configuration and try again."
            });
        }

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
        });

        if (!invitation) {
            return res.redirect(`${process.env.FRONTEND_URL}/login?error=invalid_token`);
        }

        if (invitation.used) {
            return res.redirect(`${process.env.FRONTEND_URL}/login?error=already_used`);
        }

        if (new Date(invitation.expiredAt) < new Date()) {
            return res.redirect(`${process.env.FRONTEND_URL}/login?error=expired_token`);
        }

        const frontendUrl = process.env.FRONTEND_URL.endsWith("/")
            ? process.env.FRONTEND_URL.slice(0, -1)
            : process.env.FRONTEND_URL;

        // ✅ EMPLOYEE: Skip registration, go straight to assessment
        if (invitation.role === "employee") {
            return res.redirect(`${frontendUrl}/start-assessment?token=${token}`);
        }

        // ✅ ADMIN / LEADER / MANAGER: Normal registration flow
        const isProduction = process.env.NODE_ENV === "production";
        res.cookie("invitationToken", token, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax",
            maxAge: 60 * 60 * 1000,
        });

        res.redirect(`${frontendUrl}/register?token=${token}`);
    } catch (error) {
        console.error("Accept invitation error:", error);
        res.redirect(`${process.env.FRONTEND_URL}/login`);
    }
};

// ==================== Get Invitation Details (for Register Page) ====================
export const getInvitationDetails = async (req, res) => {
    try {
        const { token } = req.params;

        const invitation = await Invitation.findOne({
            $or: [{ token: token }, { token1: token }],
        });

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
            const users = await User.find({ email: { $in: adminEmails } }).lean();
            const userMap = {};
            users.forEach(u => { userMap[u.email.toLowerCase()] = u; });

            // Collect all unique finalOrgNames
            const finalOrgNames = orgStats.map(item => {
                const adminUser = userMap[item._id.toLowerCase()];
                return adminUser?.orgName || item.orgNameFromInvite || "Pending Setup";
            });

            const uniqueOrgNames = [...new Set(finalOrgNames)];

            // Aggregate counts of invitations by orgName
            const allCounts = await Invitation.aggregate([
                { $match: { orgName: { $in: uniqueOrgNames } } },
                { $group: { _id: "$orgName", count: { $sum: 1 } } }
            ]);

            const countMap = {};
            allCounts.forEach(c => { countMap[c._id] = c.count; });

            const formattedData = orgStats.map((item) => {
                try {
                    const adminUser = userMap[item._id.toLowerCase()];
                    const finalOrgName = adminUser?.orgName || item.orgNameFromInvite || "Pending Setup";

                    let currentStatus = "Pending";
                    if (item.status) {
                        currentStatus = "Accept";
                    } else if (item.expiredAt && new Date(item.expiredAt) < new Date()) {
                        currentStatus = "Expire";
                    }

                    const totalUsers = countMap[finalOrgName] || 0;

                    return {
                        _id: item._id,
                        orgName: finalOrgName,
                        email: item._id,
                        createdAt: item.createdAt,
                        totalUsers: totalUsers,
                        status: currentStatus,
                        role: "admin"
                    };
                } catch (innerErr) {
                    return { _id: item._id, orgName: "Error", email: item._id, status: "Pending", totalUsers: 0 };
                }
            });
            return res.status(200).json(formattedData);

        } else {
            const requester = await User.findById(userId);
            const dept = requester?.department;

            const filter = { orgName: userOrg };

            if (role === "leader") {
                filter.role = { $in: ["manager", "employee"] };
                if (dept) filter.department = dept;
            } else if (role === "manager") {
                filter.role = "employee";
                if (dept) filter.department = dept;
            } else if (role === "admin") {
                // admin sees all in org
            } else {
                // employee or other, only see what they invited (though they shouldn't usually invite)
                filter.invitedBy = userId;
            }

            const invitations = await Invitation.find(filter).sort({ createdAt: -1 });
            // Optimization: Fetch all registered users and assessments for the current invitations at once
            const emails = invitations.map(inv => inv.email.toLowerCase());
            const tokens = invitations.flatMap(inv => [inv.token, inv.token1]).filter(Boolean);
            const invIds = invitations.map(inv => inv._id);

            const [registeredUsers, assessments] = await Promise.all([
                User.find({
                    $or: [
                        { invitationToken: { $in: tokens } },
                        { email: { $in: emails } }
                    ]
                }).lean(),
                Assessment.find({
                    $or: [
                        { invitationId: { $in: invIds } }
                    ]
                }).lean()
            ]);

            const userMap = {};
            for (const u of registeredUsers) {
                if (u.invitationToken) userMap[u.invitationToken] = u;
                if (u.email) userMap[u.email.toLowerCase()] = u;
            }

            const assessmentByInvOrEmail = {};
            for (const a of assessments) {
                if (a.invitationId) {
                    if (!assessmentByInvOrEmail[a.invitationId.toString()]) assessmentByInvOrEmail[a.invitationId.toString()] = [];
                    assessmentByInvOrEmail[a.invitationId.toString()].push(a);
                }
            }

            const formattedData = invitations.map((inv) => {
                // Double check department for registered users if it wasn't in the invite
                if ((role === "leader" || role === "manager") && dept) {
                    const registeredUser = userMap[inv.token1] || userMap[inv.token] || userMap[inv.email.toLowerCase()];

                    if (registeredUser && registeredUser.department && registeredUser.department !== dept) {
                        return null;
                    }
                }

                let name = "—";
                let currentStatus = inv.used ? "Accept" : (new Date(inv.expiredAt) < new Date() ? "Expire" : "Pending");

                const registeredUser = userMap[inv.token1] || userMap[inv.token] || userMap[inv.email.toLowerCase()];

                if (registeredUser) {
                    if (registeredUser.firstName || registeredUser.lastName) {
                        name = `${registeredUser.firstName || ""} ${registeredUser.lastName || ""}`.trim();
                    } else {
                        name = "Registered (Pending Info)";
                    }
                } else {
                    const assessList = assessmentByInvOrEmail[inv._id.toString()] || [];
                    const assessment = assessList[0];
                    if (assessment && assessment.userDetails) {
                        const details = assessment.userDetails;
                        name = `${details.firstName || ""} ${details.lastName || ""}`.trim() || "Completed (Anonymous)";
                    }
                }

                return {
                    _id: inv._id,
                    name: name,
                    email: inv.email,
                    role: inv.role,
                    createdAt: inv.createdAt,
                    status: currentStatus
                };
            }).filter(d => d !== null);
            return res.status(200).json(formattedData);
        }
    } catch (error) {
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

    const baseUrl = process.env.BACKEND_URL.endsWith("/")
        ? process.env.BACKEND_URL
        : `${process.env.BACKEND_URL}/`;

    const link = `${baseUrl}auth/invite/${token}`;

    await sendInvitationEmail(email, link, role, inviter.orgName);
};

export const sendBulkInvitations = async (req, res) => {
    try {
        const { userId, role: inviterRole } = req.user;

        if (!req.file) {
            return res.status(400).json({ message: "CSV file is required" });
        }

        const inviter = await User.findById(userId);
        if (!inviter) {
            return res.status(404).json({ message: "Inviter not found" });
        }

        const invitations = [];
        const failed = [];
        let success = 0;

        const allowedRoles = inviterRole.toLowerCase() === "superadmin"
            ? ["admin"]
            : ["leader", "manager", "employee"];

        // Helper function to get case-insensitive values from CSV row
        const getVal = (r, keys) => {
            const found = Object.keys(r).find(k => keys.includes(k.toLowerCase()));
            return found ? r[found] : null;
        };

        fs.createReadStream(req.file.path)
            .pipe(csv())
            .on("data", row => {
                const email = getVal(row, ["email", "e-mail", "mail"])?.trim().toLowerCase();
                const role = getVal(row, ["role", "type"])?.trim().toLowerCase();
                const department = getVal(row, ["department", "dept"])?.trim();

                if (email && role) {
                    invitations.push({ email, role, department });
                } else if (email || role) {
                    failed.push({
                        email: email || "missing",
                        reason: `Missing ${!email ? 'email' : 'role'}`
                    });
                }
            })
            .on("end", async () => {
                if (invitations.length === 0) {
                    if (req.file && fs.existsSync(req.file.path)) {
                        fs.unlinkSync(req.file.path);
                    }
                    return res.status(400).json({
                        message: "No valid invitations found in CSV. Please check the format.",
                        success: 0,
                        failedCount: failed.length,
                        failed
                    });
                }

                for (const { email, role, department } of invitations) {
                    try {
                        if (!allowedRoles.includes(role)) {
                            failed.push({
                                email,
                                reason: `Invalid role: '${role}'. Allowed: ${allowedRoles.join(", ")}`
                            });
                            continue;
                        }

                        // Hierarchy re-check for leader/manager
                        if (inviterRole.toLowerCase() === "leader" && !["manager", "employee"].includes(role)) {
                            failed.push({ email, reason: "Permission denied for this role" });
                            continue;
                        }
                        if (inviterRole.toLowerCase() === "manager" && role !== "employee") {
                            failed.push({ email, reason: "Permission denied for this role" });
                            continue;
                        }

                        await createAndSendInvite(email, role, inviter, department);
                        success++;
                    } catch (err) {
                        if (err.message === "INVALID_EMAIL") {
                            failed.push({ email, reason: "Invalid email address format" });
                        } else if (err.message === "USER_EXISTS") {
                            failed.push({ email, reason: "Already registered" });
                        } else if (err.message === "ALREADY_INVITED") {
                            failed.push({ email, reason: "Already invited" });
                        } else {
                            failed.push({ email, reason: err.message || "Failed to send invitation" });
                        }
                    }
                }

                fs.unlinkSync(req.file.path);

                res.json({
                    success,
                    failedCount: failed.length,
                    failed
                });
            })
            .on("error", (error) => {
                if (fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                }
                res.status(400).json({
                    message: "Failed to parse CSV file. Please check the format.",
                    error: error.message
                });
            });

    } catch (err) {
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({
            message: "Bulk invite failed. Please try again.",
            error: err.message
        });
    }
};
