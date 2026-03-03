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

        const formattedMembers = (await Promise.all(
            invitations.map(async (inv) => {
                // Hierarchy Filter
                // Leader sees Leaders (Peers), Managers & Employees. Manager sees Peer Managers & Employees.
                // We allow seeing peers of the same role if they belong to the same organization/department.
                if (requesterRole === "leader" && !["leader", "manager", "employee"].includes(inv.role.toLowerCase())) return null;
                if (requesterRole === "manager" && !["manager", "employee"].includes(inv.role.toLowerCase())) return null;

                let name = "—";
                let currentStatus = inv.used ? "Accept" : (new Date(inv.expiredAt) < new Date() ? "Expire" : "Pending");
                let assessmentStatus = "Not Started";

                // Try to find the registered user by token or email
                const registeredUser = await User.findOne({
                    $or: [
                        { invitationToken: inv.token1 },
                        { invitationToken: inv.token },
                        { email: inv.email.toLowerCase() }
                    ]
                });

                // Department Filter for Leader/Manager
                if (requesterRole === "leader" || requesterRole === "manager") {
                    const invDept = inv.department;
                    const userDept = registeredUser?.department;

                    // Only filter if the requester has a department AND the member (either via invite or registered user) has a department
                    // AND those departments do not match.
                    if (requesterDept) { // Requester must have a department to apply this filter
                        const memberDept = userDept || invDept; // Prioritize registered user's department, then invitation's department
                        if (memberDept && memberDept !== requesterDept) { // If member has a department AND it doesn't match requester's, filter
                            return null;
                        }
                    }
                }

                if (registeredUser) {
                    if (registeredUser.firstName || registeredUser.lastName) {
                        name = `${registeredUser.firstName || ""} ${registeredUser.lastName || ""}`.trim();
                    } else {
                        name = "Registered (Pending Info)";
                    }

                    // Check Assessment for Registered User
                    const userAssessment = await Assessment.findOne({ userId: registeredUser._id, isCompleted: true }).sort({ submittedAt: -1 });
                    if (userAssessment) {
                        assessmentStatus = "Completed";
                        // Check if expired/due (>3 months)
                        const cycleStart = getAssessmentCycleStartDate();
                        if (userAssessment.submittedAt < cycleStart) {
                            assessmentStatus = "Due"; // Expired/Recurring Due
                        }
                    } else {
                        const incomplete = await Assessment.findOne({ userId: registeredUser._id, isCompleted: false });
                        if (incomplete) assessmentStatus = "In Progress";
                    }

                } else {
                    // If no user found, check for assessment data (for employees who might have taken it without full account yet)
                    try {
                        const assessment = await Assessment.findOne({
                            $or: [
                                { invitationId: inv._id },
                                { employeeEmail: inv.email, orgName: inv.orgName }
                            ]
                        }).sort({ submittedAt: -1 });

                        if (assessment) {
                            if (assessment.userDetails) {
                                const details = assessment.userDetails;
                                name = `${details.firstName || ""} ${details.lastName || ""}`.trim() || "Member";
                            }

                            if (assessment.isCompleted) {
                                assessmentStatus = "Completed";
                            } else {
                                assessmentStatus = "In Progress";
                            }
                        }
                    } catch (e) {
                        // Assessment check failed
                    }
                }

                return {
                    _id: inv._id,
                    firstName: name.split(" ")[0] || "—",
                    lastName: name.split(" ").slice(1).join(" ") || "",
                    name: name, // For display
                    email: inv.email,
                    role: inv.role,
                    createdAt: inv.createdAt,
                    status: currentStatus,
                    assessmentStatus
                };
            })
        )).filter(m => m !== null);

        // Stats
        const adminUser = await User.findOne({ orgName, role: "admin" });

        // Only show Admin in the list for SuperAdmins and Admins
        if (adminUser && (requesterRole === "admin" || requesterRole === "superadmin")) {
            // Ensure Admin isn't already in the list via invitation
            const isAdminListed = formattedMembers.some(m => m.email === adminUser.email);

            if (!isAdminListed) {
                let adminAssessmentStatus = "Not Started";
                const adminAssessment = await Assessment.findOne({ userId: adminUser._id, isCompleted: true }).sort({ submittedAt: -1 });

                if (adminAssessment) {
                    adminAssessmentStatus = "Completed";
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
                    assessmentStatus: adminAssessmentStatus
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
