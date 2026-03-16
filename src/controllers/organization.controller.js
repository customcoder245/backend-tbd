import User from "../models/user.model.js";
import Invitation from "../models/invitation.model.js";
import Assessment from "../models/assessment.model.js";
import { getAssessmentCycleStartDate } from "../config/assessment.config.js";

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

        // Fetch all invitations for this organization (case-insensitive)
        const invitations = await Invitation.find({
            orgName: { $regex: new RegExp("^" + orgName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + "$", "i") }
        }).sort({ createdAt: -1 });

        const formattedMembers = [];
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
                    { invitationId: { $in: invIds } },
                    { employeeEmail: { $in: invitations.map(inv => new RegExp("^" + inv.email.replace(/[-\/\\^$*+?.()|[\\]{}]/g, '\\\\$&') + "$", "i")) } }
                ]
            }).sort({ submittedAt: -1 }).lean()
        ]);

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

        for (const inv of invitations) {
            if (requesterRole === "leader" && !["leader", "manager", "employee"].includes(inv.role.toLowerCase())) continue;
            if (requesterRole === "manager" && !["manager", "employee"].includes(inv.role.toLowerCase())) continue;

            let name = "—";
            let currentStatus = inv.used ? "Accept" : (new Date(inv.expiredAt) < new Date() ? "Expire" : "Pending");
            let assessmentStatus = "Not Started";
            let lastScore = 0;
            let classification = null;

            const registeredUser = userMap[inv.token1] || userMap[inv.token] || userMap[inv.email.toLowerCase()];

            if (requesterRole === "leader" || requesterRole === "manager") {
                const invDept = inv.department;
                const userDept = registeredUser?.department;
                if (requesterDept) {
                    const memberDept = userDept || invDept;
                    if (memberDept && memberDept !== requesterDept) continue;
                }
            }

            if (registeredUser) {
                if (registeredUser.firstName || registeredUser.lastName) {
                    name = `${registeredUser.firstName || ""} ${registeredUser.lastName || ""}`.trim();
                } else {
                    name = "Registered (Pending Info)";
                }

                const userAssesses = assessmentByUserId[registeredUser._id.toString()] || [];
                const completeAsses = userAssesses.find(a => a.isCompleted);

                if (completeAsses) {
                    assessmentStatus = "Completed";
                    lastScore = Math.round(completeAsses.scores?.overall || registeredUser.lastAssessmentScore || 0);
                    classification = completeAsses.classification || registeredUser.lastAssessmentClassification;
                    const cycleStart = getAssessmentCycleStartDate();
                    if (completeAsses.submittedAt < cycleStart) assessmentStatus = "Due";
                } else {
                    const incomplete = userAssesses.find(a => !a.isCompleted);
                    if (incomplete) assessmentStatus = "In Progress";
                }
            } else {
                const assessList1 = assessmentByInvOrEmail[inv._id.toString()] || [];
                const assessList2 = assessmentByInvOrEmail[inv.email.toLowerCase()] || [];
                const assessList = [...assessList1, ...assessList2];
                // Taking the first one since it's already sorted by submittedAt DESC in DB, but we concatenated two lists, so let's resort
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
            }

            formattedMembers.push({
                _id: inv._id,
                firstName: name.split(" ")[0] || "—",
                lastName: name.split(" ").slice(1).join(" ") || "",
                name: name,
                email: inv.email,
                role: inv.role,
                createdAt: inv.createdAt,
                status: currentStatus,
                assessmentStatus,
                lastScore,
                classification
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
                    createdAt: adminUser.createdAt,
                    status: "Accept", // Admin is active
                    assessmentStatus: adminAssessmentStatus,
                    lastScore,
                    classification
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

        const orgRegex = { $regex: new RegExp("^" + orgName + "$", "i") };

        const [depts, roles, userDepts, userRoles, invitations, registeredUsers] = await Promise.all([
            Invitation.distinct("department", { orgName: orgRegex }),
            Invitation.distinct("role", { orgName: orgRegex }),
            User.distinct("department", { orgName: orgRegex }),
            User.distinct("role", { orgName: orgRegex }),
            Invitation.find({ orgName: orgRegex }).select("email role department").lean(),
            User.find({ orgName: orgRegex }).select("firstName lastName email role department profileImage").lean()
        ]);

        const allDepts = [...new Set([...depts, ...userDepts])].filter(Boolean).sort();
        const allRoles = [...new Set([...roles, ...userRoles])].filter(Boolean).sort();

        // Check assessment completion for all members
        const invIds = invitations.map(i => i._id);
        const invEmails = invitations.map(i => i.email);
        const userIds = registeredUsers.map(u => u._id);
        const userEmails = registeredUsers.map(u => u.email);

        const assessments = await Assessment.find({
            $or: [
                { invitationId: { $in: invIds } },
                { employeeEmail: { $in: [...invEmails, ...userEmails] } },
                { userId: { $in: userIds } }
            ],
            isCompleted: true
        }).select("userId employeeEmail invitationId userDetails").lean();

        // Create lookups for names and status
        const completedEmails = new Set();
        const completedUserIds = new Set();
        const completedInvIds = new Set();
        const nameFallbackLookups = new Map(); // email -> name

        assessments.forEach(a => {
            if (a.employeeEmail) completedEmails.add(a.employeeEmail.toLowerCase());
            if (a.userId) completedUserIds.add(a.userId.toString());
            if (a.invitationId) completedInvIds.add(a.invitationId.toString());

            // If assessment has userDetails with name info, use it as fallback
            if (a.userDetails?.firstName) {
                const fullName = `${a.userDetails.firstName} ${a.userDetails.lastName || ""}`.trim();
                if (fullName) {
                    if (a.employeeEmail) nameFallbackLookups.set(a.employeeEmail.toLowerCase(), fullName);
                }
            }
        });

        const members = [];
        const processedEmails = new Set();

        registeredUsers.forEach(u => {
            const name = `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email;
            const hasCompleted = completedUserIds.has(u._id.toString()) || completedEmails.has(u.email.toLowerCase());
            members.push({
                _id: u._id,
                name,
                email: u.email,
                role: u.role,
                department: u.department,
                profileImage: u.profileImage,
                assessmentStatus: hasCompleted ? "Completed" : "Pending"
            });
            processedEmails.add(u.email.toLowerCase());
        });

        invitations.forEach(inv => {
            const emailLower = inv.email.toLowerCase();
            if (!processedEmails.has(emailLower)) {
                const hasCompleted = completedInvIds.has(inv._id.toString()) || completedEmails.has(emailLower);
                // Try to get name from fallback (assessment) if invitation doesn't have it
                const resolvedName = nameFallbackLookups.get(emailLower) || inv.email;

                members.push({
                    _id: inv._id,
                    name: resolvedName,
                    email: inv.email,
                    role: inv.role,
                    department: inv.department,
                    assessmentStatus: hasCompleted ? "Completed" : "Pending"
                });
            }
        });

        res.status(200).json({
            departments: allDepts,
            roles: allRoles,
            members: members.sort((a, b) => a.name.localeCompare(b.name))
        });
    } catch (error) {
        console.error("getOrgFilters error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
