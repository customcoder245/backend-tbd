import User from "../models/user.model.js";
import Invitation from "../models/invitation.model.js";
import Assessment from "../models/assessment.model.js";
import { sendInvitationEmail } from "../utils/sendEmail.js";
import jwt from "jsonwebtoken";
import { createNotification } from "../utils/notification.utils.js";
import fs from "fs";
import csv from "csv-parser";

// ================= Send Invitation =================
export const sendInvitation = async (req, res) => {
    try {
        const { email, role } = req.body;
        const inviterId = req.user.userId;

        if (!email || !role) {
            return res.status(400).json({ message: "Email and role are required" });
        }

        const inviter = await User.findById(inviterId);
        if (!inviter) {
            return res.status(404).json({ message: "Inviter not found" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User with this email already exists" });
        }

        const existingInvite = await Invitation.findOne({ email, used: false });
        if (existingInvite) {
            return res.status(400).json({ message: "User has already been invited" });
        }

        const token = jwt.sign(
            { email, role, invitedId: inviterId, orgName: inviter.orgName },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        const invitation = new Invitation({
            email,
            role,
            token,
            token1: token,
            invitedBy: inviterId,
            adminId: inviterId,
            orgName: inviter.orgName,
            expiredAt: Date.now() + 60 * 60 * 1000,
        });
        await invitation.save();

        const baseUrl = process.env.BACKEND_URL.endsWith("/")
            ? process.env.BACKEND_URL
            : `${process.env.BACKEND_URL}/`;

        const link = `${baseUrl}auth/invite/${token}`;

        await sendInvitationEmail(email, link, role, inviter.orgName);

        res.status(200).json({ message: "Invitation sent successfully" });
    } catch (error) {
        console.error("Send invitation error:", error);
        res.status(500).json({ message: "Server error" });
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

        const isProduction = process.env.NODE_ENV === "production";
        res.cookie("invitationToken", token, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax",
            maxAge: 60 * 60 * 1000,
        });

        const frontendUrl = process.env.FRONTEND_URL.endsWith("/")
            ? process.env.FRONTEND_URL.slice(0, -1)
            : process.env.FRONTEND_URL;

        res.redirect(`${frontendUrl}/register?token=${token}`);
    } catch (error) {
        console.error("Accept invitation error:", error);
        res.redirect(`${process.env.FRONTEND_URL}/login`);
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

            const formattedData = await Promise.all(
                orgStats.map(async (item) => {
                    try {
                        const adminUser = await User.findOne({ email: item._id });
                        const finalOrgName = adminUser?.orgName || item.orgNameFromInvite || "Pending Setup";

                        let currentStatus = "Pending";
                        if (item.status) {
                            currentStatus = "Accept";
                        } else if (item.expiredAt && new Date(item.expiredAt) < new Date()) {
                            currentStatus = "Expire";
                        }

                        const totalUsers = await Invitation.countDocuments({
                            orgName: finalOrgName
                        });

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
                })
            );
            return res.status(200).json(formattedData);

        } else {
            const invitations = await Invitation.find({ orgName: userOrg, invitedBy: userId }).sort({ createdAt: -1 });
            const formattedData = await Promise.all(
                invitations.map(async (inv) => {
                    let name = "—";
                    let currentStatus = inv.used ? "Accept" : (new Date(inv.expiredAt) < new Date() ? "Expire" : "Pending");

                    const registeredUser = await User.findOne({
                        $or: [
                            { invitationToken: inv.token1 },
                            { invitationToken: inv.token },
                            { email: inv.email }
                        ]
                    });

                    if (registeredUser) {
                        if (registeredUser.firstName || registeredUser.lastName) {
                            name = `${registeredUser.firstName || ""} ${registeredUser.lastName || ""}`.trim();
                        } else {
                            name = "Registered (Pending Info)";
                        }
                    } else {
                        const assessment = await Assessment.findOne({ invitationId: inv._id });
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
                })
            );
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

export const createAndSendInvite = async (email, role, inviter) => {
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
        adminId: inviter._id,
        invitedBy: inviter._id,
        orgName: inviter.orgName,
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

        fs.createReadStream(req.file.path)
            .pipe(csv())
            .on("data", row => {
                const email = row.email?.trim().toLowerCase();
                const role = row.role?.trim().toLowerCase();

                if (email && role) {
                    invitations.push({ email, role });
                } else if (email || role) {
                    failed.push({
                        email: email || "missing",
                        reason: `Missing ${!email ? 'email' : 'role'}`
                    });
                }
            })
            .on("end", async () => {
                if (invitations.length === 0) {
                    fs.unlinkSync(req.file.path);
                    return res.status(400).json({
                        message: "No valid invitations found in CSV. Please check the format.",
                        success: 0,
                        failedCount: failed.length,
                        failed
                    });
                }

                for (const { email, role } of invitations) {
                    try {
                        if (!allowedRoles.includes(role)) {
                            failed.push({
                                email,
                                reason: `Invalid role: '${role}'. Allowed: ${allowedRoles.join(", ")}`
                            });
                            continue;
                        }

                        await createAndSendInvite(email, role, inviter);
                        success++;
                    } catch (err) {
                        if (err.message === "USER_EXISTS") {
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
