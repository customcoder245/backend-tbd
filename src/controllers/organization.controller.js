import User from "../models/user.model.js";
import Invitation from "../models/invitation.model.js";
import Assessment from "../models/assessment.model.js";
import Response from "../models/response.model.js";
import SubmittedAssessment from "../models/submittedAssessment.model.js";
import { getAssessmentCycleStartDate } from "../config/assessment.config.js";
import jwt from "jsonwebtoken";
import { sendAssessmentResetEmail } from "../utils/sendEmail.js";

// ==================== GET Organization Details ====================
export const getOrgDetails = async (req, res) => {
    try {
        const { orgName } = req.params;
        if (!orgName) return res.status(400).json({ message: "Org name is required" });

        // Get requester info for filtering
        const requester = await User.findById(req.user.userId);
        const requesterRole = requester?.role?.toLowerCase() || "";
        const requesterDept = requester?.department;

        if (requesterRole === "employee") {
            return res.status(403).json({ message: "Access denied. Employees do not have permission to view organization details." });
        }

        // Regex escaping for safe lookups
        const safeOrgName = orgName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const orgRegex = { $regex: new RegExp("^" + safeOrgName + "$", "i") };

        // Fetch all invitations and registered users for this organization
        const [invitations, registeredUsers] = await Promise.all([
            Invitation.find({ orgName: orgRegex }).sort({ createdAt: -1 }),
            User.find({ orgName: orgRegex }).lean()
        ]);

        const formattedMembers = [];
        const invEmails = invitations.map(inv => inv.email.toLowerCase());
        const invIds = invitations.map(inv => inv._id);

        const assessments = await Assessment.find({
            isDeleted: { $ne: true },
            $or: [
                { invitationId: { $in: invIds } },
                { employeeEmail: { $in: invEmails } },
                { userId: { $in: registeredUsers.map(u => u._id) } }
            ]
        }).sort({ submittedAt: -1 }).lean();

        const userMap = {};
        for (const u of registeredUsers) {
            if (u.invitationToken) userMap[u.invitationToken] = u;
            if (u.email) userMap[u.email.toLowerCase()] = u;
        }

        const assessmentByUserId = {};
        const assessmentByInvOrEmail = {};
        for (const a of assessments) {
            if (a.userId) {
                if (!assessmentByUserId[a.userId]) assessmentByUserId[a.userId] = [];
                assessmentByUserId[a.userId].push(a);
            }
            if (a.invitationId) {
                if (!assessmentByInvOrEmail[a.invitationId.toString()]) assessmentByInvOrEmail[a.invitationId.toString()] = [];
                assessmentByInvOrEmail[a.invitationId.toString()].push(a);
            }
            if (a.employeeEmail) {
                const em = a.employeeEmail.toLowerCase();
                if (!assessmentByInvOrEmail[em]) assessmentByInvOrEmail[em] = [];
                assessmentByInvOrEmail[em].push(a);
            }
        }

        const processedEmails = new Set();

        // 1. First Pass: Registered Users
        for (const u of registeredUsers) {
            const roleLower = u.role?.toLowerCase() || "";
            // Hierarchy filter
            if (requesterRole === "leader" && !["leader", "manager", "employee"].includes(roleLower)) continue;
            if (requesterRole === "manager" && !["manager", "employee"].includes(roleLower)) continue;
            if (requesterDept && u.department && u.department !== requesterDept && (requesterRole === "leader" || requesterRole === "manager")) continue;

            let name = `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email;
            let assessmentStatus = "Not Started";
            let lastScore = 0;
            let classification = null;

            const userAssesses = assessmentByUserId[u._id.toString()] || [];
            const completeAsses = userAssesses.find(a => a.isCompleted);

            if (completeAsses) {
                assessmentStatus = "Completed";
                lastScore = Math.round(completeAsses.scores?.overall || u.lastAssessmentScore || 0);
                classification = completeAsses.classification || u.lastAssessmentClassification;
                const cycleStart = getAssessmentCycleStartDate();
                if (completeAsses.submittedAt < cycleStart) assessmentStatus = "Due";
            } else {
                const incomplete = userAssesses.find(a => !a.isCompleted);
                if (incomplete) assessmentStatus = "In Progress";
            }

            // Department: prefer user record, fall back to submitted assessment userDetails
            const userAssessmentDept = userAssesses.find(a => a.userDetails?.department)?.userDetails?.department;

            formattedMembers.push({
                _id: u._id,
                firstName: u.firstName || "—",
                lastName: u.lastName || "",
                name: name,
                email: u.email,
                role: u.role,
                department: u.department || userAssessmentDept || "—",
                createdAt: u.createdAt,
                status: (u.isEmailVerified && u.profileCompleted) || assessmentStatus === "Completed" ? "Accept" : "Pending",
                assessmentStatus,
                lastScore,
                classification,
                lastAssessmentId: completeAsses?._id || null
            });
            processedEmails.add(u.email.toLowerCase());
        }

        // 2. Second Pass: Invited but not registered members
        for (const inv of invitations) {
            const emailLower = inv.email.toLowerCase();
            if (processedEmails.has(emailLower)) continue;

            const roleLower = inv.role?.toLowerCase() || "";
            // Hierarchy filter
            if (requesterRole === "leader" && !["leader", "manager", "employee"].includes(roleLower)) continue;
            if (requesterRole === "manager" && !["manager", "employee"].includes(roleLower)) continue;
            if (requesterDept && inv.department && inv.department !== requesterDept && (requesterRole === "leader" || requesterRole === "manager")) continue;

            let name = "—";
            let currentStatus = (new Date(inv.expiredAt) < new Date() ? "Expire" : "Pending");
            let assessmentStatus = "Not Started";
            let lastScore = 0;
            let classification = null;

            const assessList1 = assessmentByInvOrEmail[inv._id.toString()] || [];
            const assessList2 = assessmentByInvOrEmail[emailLower] || [];
            const assessList = [...assessList1, ...assessList2];
            assessList.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
            const assessment = assessList[0];

            if (assessment) {
                if (assessment.userDetails) {
                    const details = assessment.userDetails;
                    name = `${details.firstName || ""} ${details.lastName || ""}`.trim() || "Member";
                }
                if (assessment.isCompleted) {
                    assessmentStatus = "Completed";
                    lastScore = Math.round(assessment.scores?.overall || 0);
                    classification = assessment.classification;
                } else {
                    assessmentStatus = "In Progress";
                }
            }

            // Department: prefer invitation record, fall back to assessment userDetails
            const assessmentDept = assessment?.userDetails?.department
                || assessList.find(a => a.userDetails?.department)?.userDetails?.department;

            formattedMembers.push({
                _id: inv._id,
                firstName: name.split(" ")[0] || "—",
                lastName: name.split(" ").slice(1).join(" ") || "",
                name: name,
                email: inv.email,
                role: inv.role,
                department: inv.department || assessmentDept || "—",
                createdAt: inv.createdAt,
                status: assessmentStatus === "Completed" ? "Accept" : currentStatus,
                assessmentStatus,
                lastScore,
                classification,
                lastAssessmentId: (assessment && assessment.isCompleted) ? assessment._id : null
            });
        }

        // Stats
        const adminUser = await User.findOne({ orgName, role: "admin" });

        // Only show Admin in the list for SuperAdmins and Admins
        if (adminUser && (requesterRole === "admin" || requesterRole === "superadmin")) {
            // Ensure Admin isn't already in the list via invitation
            const isAdminListed = formattedMembers.some(m => m.email === adminUser.email);

            if (!isAdminListed) {
                let adminAssessmentStatus = "Not Started";
                let lastScore = 0;
                let classification = null;
                const adminAssessment = await Assessment.findOne({ userId: adminUser._id, isCompleted: true }).sort({ submittedAt: -1 });

                if (adminAssessment) {
                    adminAssessmentStatus = "Completed";
                    lastScore = Math.round(adminAssessment.scores?.overall || adminUser.lastAssessmentScore || 0);
                    classification = adminAssessment.classification || adminUser.lastAssessmentClassification;
                    const cycleStart = getAssessmentCycleStartDate();
                    if (adminAssessment.submittedAt < cycleStart) {
                        adminAssessmentStatus = "Due";
                    }
                } else {
                    const incomplete = await Assessment.findOne({ userId: adminUser._id, isCompleted: false });
                    if (incomplete) adminAssessmentStatus = "In Progress";
                }

                formattedMembers.unshift({
                    _id: adminUser._id,
                    firstName: adminUser.firstName || "Admin",
                    lastName: adminUser.lastName || "",
                    name: `${adminUser.firstName || ""} ${adminUser.lastName || ""}`.trim(),
                    email: adminUser.email,
                    role: "admin",
                    department: adminUser.department || "—",
                    createdAt: adminUser.createdAt,
                    status: "Accept", // Admin is active
                    assessmentStatus: adminAssessmentStatus,
                    lastScore,
                    classification,
                    lastAssessmentId: adminAssessment?._id || null
                });
            }
        }

        const totalMembers = formattedMembers.length;

        // Status can be derived from the admin account status or existence
        const status = adminUser ? (adminUser.isEmailVerified && adminUser.profileCompleted ? "Accept" : "Pending") : "Expired";

        res.status(200).json({
            details: {
                orgName,
                createdAt: adminUser?.createdAt || "N/A",
                status: status,
                totalTeamMember: totalMembers
            },
            members: formattedMembers
        });
    } catch (error) {
        console.error("getOrgDetails error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// ==================== GET All Organizations (SuperAdmin Only) ====================
export const getAllOrganizations = async (req, res) => {
    try {
        // Fetch all unique orgNames from invitations & users
        const orgsFromInvites = await Invitation.distinct("orgName");
        const orgsFromUsers = await User.distinct("orgName");

        const allOrgs = [...new Set([...orgsFromInvites, ...orgsFromUsers])].filter(Boolean).sort();

        res.status(200).json({ organizations: allOrgs });
    } catch (error) {
        console.error("getAllOrganizations error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// ==================== GET Org Filters (Depts, Roles, Members) ====================
export const getOrgFilters = async (req, res) => {
    try {
        const { orgName } = req.params;
        if (!orgName) return res.status(400).json({ message: "Org name is required" });

        const requester = await User.findById(req.user.userId).select("role").lean();
        const requesterRole = requester?.role?.toLowerCase() || "";
        const hideDepartmentDropdown = requesterRole === "leader" || requesterRole === "manager";

        const safeOrgName = orgName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const orgRegex = { $regex: new RegExp("^" + safeOrgName + "$", "i") };

        const [depts, roles, userDepts, userRoles, invitations, registeredUsers] = await Promise.all([
            Invitation.distinct("department", { orgName: orgRegex }),
            Invitation.distinct("role", { orgName: orgRegex }),
            User.distinct("department", { orgName: orgRegex }),
            User.distinct("role", { orgName: orgRegex }),
            Invitation.find({ orgName: orgRegex }).select("email role department").lean(),
            User.find({ orgName: orgRegex }).select("firstName lastName email role department profileImage").lean()
        ]);

        // Find all completed assessments for this organization to catch ghost members and fill missing data
        // Include stakeholder field to ensure role fallback works for non-registered users
        const assessments = await Assessment.find({
            orgName: orgRegex,
            isCompleted: true
        }).select("userId employeeEmail invitationId userDetails scores classification stakeholder").lean();

        // Create lookups and extract unique departments/roles from assessments
        const completedEmails = new Set();
        const completedUserIds = new Set();
        const completedInvIds = new Set();
        const nameFallbackLookups = new Map(); // email -> name
        const deptFallbackLookups = new Map(); // email -> department
        const roleFallbackLookups = new Map(); // email -> role

        const extraDepts = new Set();
        const extraRoles = new Set();

        assessments.forEach(a => {
            const email = a.employeeEmail?.toLowerCase() || a.userDetails?.email?.toLowerCase();
            if (email) {
                completedEmails.add(email);
                if (a.userDetails?.department) {
                    deptFallbackLookups.set(email, a.userDetails.department);
                    extraDepts.add(a.userDetails.department);
                }
                if (a.userDetails?.role) {
                    roleFallbackLookups.set(email, a.userDetails.role);
                    extraRoles.add(a.userDetails.role);
                } else if (a.stakeholder) {
                    roleFallbackLookups.set(email, a.stakeholder);
                    extraRoles.add(a.stakeholder);
                }

                if (a.userDetails?.firstName) {
                    const fullName = `${a.userDetails.firstName} ${a.userDetails.lastName || ""}`.trim();
                    if (fullName) nameFallbackLookups.set(email, fullName);
                }
            }
            if (a.userId) completedUserIds.add(a.userId.toString());
            if (a.invitationId) completedInvIds.add(a.invitationId.toString());
        });

        const allDepts = [...new Set([...depts, ...userDepts, ...extraDepts])].filter(Boolean).sort();
        const allRoles = [...new Set([...roles, ...userRoles, ...extraRoles])].filter(Boolean).sort();

        const members = [];
        const processedEmails = new Set();

        // 1. Registered Users - Prioritize assessment data for department/role
        registeredUsers.forEach(u => {
            const emailLower = u.email.toLowerCase();
            const name = `${u.firstName || ""} ${u.lastName || ""}`.trim() || nameFallbackLookups.get(emailLower) || u.email;
            const hasCompleted = completedUserIds.has(u._id.toString()) || completedEmails.has(emailLower);

            members.push({
                _id: u._id,
                name,
                email: u.email,
                role: roleFallbackLookups.get(emailLower) || u.role,
                department: deptFallbackLookups.get(emailLower) || u.department,
                profileImage: u.profileImage,
                assessmentStatus: hasCompleted ? "Completed" : "Pending"
            });
            processedEmails.add(emailLower);
        });

        // 2. Invitations - Prioritize assessment data for department/role
        invitations.forEach(inv => {
            const emailLower = inv.email.toLowerCase();
            if (!processedEmails.has(emailLower)) {
                const hasCompleted = completedInvIds.has(inv._id.toString()) || completedEmails.has(emailLower);
                const resolvedName = nameFallbackLookups.get(emailLower) || inv.email;

                members.push({
                    _id: inv._id,
                    name: resolvedName,
                    email: inv.email,
                    role: roleFallbackLookups.get(emailLower) || inv.role,
                    department: deptFallbackLookups.get(emailLower) || inv.department,
                    assessmentStatus: hasCompleted ? "Completed" : "Pending"
                });
                processedEmails.add(emailLower);
            }
        });

        // 3. Catch Ghost Members (Assessed but no User/Inv record)
        assessments.forEach(a => {
            const email = a.employeeEmail?.toLowerCase() || a.userDetails?.email?.toLowerCase();
            if (email && !processedEmails.has(email)) {
                const fullName = nameFallbackLookups.get(email) || email;
                members.push({
                    _id: a._id, // Use assessment ID as fallback ID
                    name: fullName,
                    email: email,
                    role: a.userDetails?.role || a.stakeholder || "employee",
                    department: a.userDetails?.department || "",
                    assessmentStatus: "Completed"
                });
                processedEmails.add(email);
            }
        });

        res.status(200).json({
            departments: hideDepartmentDropdown ? [] : allDepts,
            roles: allRoles,
            members: members
                .filter(m => m.assessmentStatus === "Completed")
                .sort((a, b) => a.name.localeCompare(b.name))
        });
    } catch (error) {
        console.error("getOrgFilters error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// ==================== RESET Assessment for a User (Admin Only) ====================
export const resetAssessmentForUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const requesterId = req.user.userId;
        const requesterRole = req.user.role?.toLowerCase();

        // Only authorized roles can perform this action
        const allowedRoles = ["admin", "leader"];
        if (!allowedRoles.includes(requesterRole)) {
            return res.status(403).json({ message: "Access denied. Only organization admins and leaders can reset assessments." });
        }

        // Admins cannot reset their OWN assessment
        if (requesterId.toString() === userId.toString()) {
            return res.status(403).json({ message: "Admins cannot reset their own assessment." });
        }

        // Find the target user (registered) OR treat userId as invitationId
        const targetUser = await User.findById(userId).lean();

        let assessmentQuery = {};
        let invitationQuery = {};

        if (targetUser) {
            // Registered user: look up assessment by userId
            assessmentQuery = { userId: targetUser._id, isDeleted: { $ne: true } };
            invitationQuery = { email: targetUser.email };
        } else {
            // Not a registered user — userId is likely an invitationId
            const invitation = await Invitation.findById(userId).lean();
            if (!invitation) {
                return res.status(404).json({ message: "User or invitation not found." });
            }
            assessmentQuery = {
                $or: [
                    { invitationId: invitation._id, isDeleted: { $ne: true } },
                    { employeeEmail: invitation.email, isDeleted: { $ne: true } }
                ]
            };
            invitationQuery = { _id: invitation._id };
        }

        // Soft-delete ALL current assessment records for this user/invitation
        const assessments = await Assessment.find(assessmentQuery);
        if (!assessments.length) {
            return res.status(404).json({ message: "No active assessment found to reset." });
        }

        const assessmentIds = assessments.map(a => a._id);

        // Soft-delete: mark as reset (preserve data for history/future use)
        await Assessment.updateMany(
            { _id: { $in: assessmentIds } },
            {
                $set: {
                    isDeleted: true,
                    deletedAt: new Date(),
                    deletedReason: "reset_by_admin"
                }
            }
        );

        // Also soft-delete associated responses and snapshots
        await Promise.all([
            Response.updateMany(
                { assessmentId: { $in: assessmentIds.map(id => id.toString()) } },
                { $set: { isDeleted: true, deletedAt: new Date() } }
            ),
            SubmittedAssessment.updateMany(
                { assessmentId: { $in: assessmentIds } },
                { $set: { isDeleted: true, deletedAt: new Date() } }
            )
        ]);

        // Reset the invitation, update token, and notify the user via email
        const invitation = await Invitation.findOne(invitationQuery);
        if (invitation) {
            const tokenExpiry = "3d";
            const dbExpiry = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

            // Generate a fresh session token
            const newToken = jwt.sign(
                {
                    email: invitation.email,
                    role: invitation.role,
                    invitedId: requesterId,
                    orgName: invitation.orgName
                },
                process.env.JWT_SECRET,
                { expiresIn: tokenExpiry }
            );

            await Invitation.findByIdAndUpdate(invitation._id, {
                $set: {
                    token: newToken,
                    token1: newToken,
                    used: false,
                    expiredAt: dbExpiry,
                    invitedBy: requesterId
                }
            });

            // Send Email NOTIFICATION
            const backendUrl = process.env.BACKEND_URL || "";
            const baseUrl = backendUrl.endsWith("/") ? backendUrl : `${backendUrl}/`;
            const link = `${baseUrl}auth/invite/${newToken}`;

            try {
                await sendAssessmentResetEmail(
                    invitation.email,
                    link,
                    targetUser?.firstName || "",
                    invitation.orgName || "Talent By Design"
                );
            } catch (err) {
                console.error("Failed to send reset assessment email Although assessment was reset:", err.message);
            }
        } else {
            // Fallback: Just reset matching invitation records by query if direct find failed
            await Invitation.updateMany(
                invitationQuery,
                { $set: { used: false } }
            );
        }

        // Update user snapshot scores if it is a registered user
        if (targetUser) {
            await User.findByIdAndUpdate(targetUser._id, {
                $set: {
                    lastAssessmentScore: 0,
                    lastAssessmentClassification: null
                }
            });
        }

        return res.status(200).json({
            message: "Assessment has been reset successfully. The user will be required to retake the assessment.",
            resetCount: assessmentIds.length
        });
    } catch (error) {
        console.error("resetAssessmentForUser error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// ==================== GET Organization Members (For AdminAssessment) ====================
export const getOrgMembers = async (req, res) => {
    try {
        const orgName = req.user.orgName;
        if (!orgName) return res.status(400).json({ message: "Organization not found" });

        // Reuse getOrgDetails logic but simpler
        const safeOrgName = orgName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const orgRegex = { $regex: new RegExp("^" + safeOrgName + "$", "i") };

        const [invitations, registeredUsers] = await Promise.all([
            Invitation.find({ orgName: orgRegex }).sort({ createdAt: -1 }),
            User.find({ orgName: orgRegex }).lean()
        ]);

        const formattedMembers = [];
        const invEmails = invitations.map(inv => inv.email.toLowerCase());
        const invIds = invitations.map(inv => inv._id);

        const assessments = await Assessment.find({
            isDeleted: { $ne: true },
            $or: [
                { invitationId: { $in: invIds } },
                { employeeEmail: { $in: invEmails } },
                { userId: { $in: registeredUsers.map(u => u._id) } }
            ]
        }).sort({ submittedAt: -1 }).lean();

        const assessmentByUserId = {};
        const assessmentByInvOrEmail = {};
        for (const a of assessments) {
            if (a.userId) {
                if (!assessmentByUserId[a.userId]) assessmentByUserId[a.userId] = [];
                assessmentByUserId[a.userId].push(a);
            }
            if (a.invitationId) {
                if (!assessmentByInvOrEmail[a.invitationId.toString()]) assessmentByInvOrEmail[a.invitationId.toString()] = [];
                assessmentByInvOrEmail[a.invitationId.toString()].push(a);
            }
            if (a.employeeEmail) {
                const em = a.employeeEmail.toLowerCase();
                if (!assessmentByInvOrEmail[em]) assessmentByInvOrEmail[em] = [];
                assessmentByInvOrEmail[em].push(a);
            }
        }

        const processedEmails = new Set();
        const requesterRole = req.user.role?.toLowerCase();
        const requesterDept = (await User.findById(req.user.userId).select("department").lean())?.department;

        // 1. Registered Users
        for (const u of registeredUsers) {
            const roleLower = u.role?.toLowerCase();

            // Hierarchy filter
            if (requesterRole === "leader" && !["manager", "employee"].includes(roleLower)) continue;
            if (requesterRole === "manager" && roleLower !== "employee") continue;

            // Department filter
            if (requesterDept && u.department && u.department !== requesterDept && (requesterRole === "leader" || requesterRole === "manager")) continue;

            let assessmentStatus = "Not Started";
            const userAssesses = assessmentByUserId[u._id.toString()] || [];
            const completeAsses = userAssesses.find(a => a.isCompleted);

            if (completeAsses) {
                assessmentStatus = "Completed";
                const cycleStart = getAssessmentCycleStartDate();
                if (completeAsses.submittedAt < cycleStart) assessmentStatus = "Due";
            } else {
                const incomplete = userAssesses.find(a => !a.isCompleted);
                if (incomplete) assessmentStatus = "In Progress";
            }

            // Department: prefer User record, fall back to assessment userDetails
            const userAssessmentDept = userAssesses.find(a => a.userDetails?.department)?.userDetails?.department;

            formattedMembers.push({
                _id: u._id,
                firstName: u.firstName || "—",
                lastName: u.lastName || "",
                email: u.email,
                role: u.role,
                department: u.department || userAssessmentDept || "—",
                assessmentStatus
            });
            processedEmails.add(u.email.toLowerCase());
        }

        // 2. Invitations
        for (const inv of invitations) {
            const emailLower = inv.email.toLowerCase();
            if (processedEmails.has(emailLower)) continue;

            const roleLower = inv.role?.toLowerCase();

            // Hierarchy filter
            if (requesterRole === "leader" && !["manager", "employee"].includes(roleLower)) continue;
            if (requesterRole === "manager" && roleLower !== "employee") continue;

            // Department filter
            if (requesterDept && inv.department && inv.department !== requesterDept && (requesterRole === "leader" || requesterRole === "manager")) continue;

            let assessmentStatus = "Not Started";
            const assessList1 = assessmentByInvOrEmail[inv._id.toString()] || [];
            const assessList2 = assessmentByInvOrEmail[emailLower] || [];
            const assessList = [...assessList1, ...assessList2];
            assessList.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
            const assessment = assessList[0];

            if (assessment) {
                assessmentStatus = assessment.isCompleted ? "Completed" : "In Progress";
            }

            // Department: prefer invitation record, fall back to assessment userDetails
            const assessmentDept = assessment?.userDetails?.department
                || assessList.find(a => a.userDetails?.department)?.userDetails?.department;

            formattedMembers.push({
                _id: inv._id,
                firstName: inv.name?.split(" ")[0] || assessment?.userDetails?.firstName || "—",
                lastName: inv.name?.split(" ").slice(1).join(" ") || assessment?.userDetails?.lastName || "",
                email: inv.email,
                role: inv.role,
                department: inv.department || assessmentDept || "—",
                assessmentStatus
            });
        }

        res.status(200).json({ members: formattedMembers });
    } catch (error) {
        console.error("getOrgMembers error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
