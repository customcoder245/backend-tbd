import User from "../models/user.model.js";
import Invitation from "../models/invitation.model.js";
import Assessment from "../models/assessment.model.js";

// ==================== GET Organization Details ====================
export const getOrgDetails = async (req, res) => {
    try {
        const { orgName } = req.params;
        if (!orgName) return res.status(400).json({ message: "Org name is required" });

        // Fetch all invitations for this organization
        const invitations = await Invitation.find({ orgName }).sort({ createdAt: -1 });

        const formattedMembers = await Promise.all(
            invitations.map(async (inv) => {
                let name = "—";
                let currentStatus = inv.used ? "Accept" : (new Date(inv.expiredAt) < new Date() ? "Expire" : "Pending");
                let assessmentStatus = "Not Started";

                // Try to find the registered user by token or email
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

                    // Check Assessment for Registered User
                    const userAssessment = await Assessment.findOne({ userId: registeredUser._id, isCompleted: true }).sort({ submittedAt: -1 });
                    if (userAssessment) {
                        assessmentStatus = "Completed";
                        // Check if expired/due (>3 months)
                        const threeMonthsAgo = new Date();
                        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
                        if (userAssessment.submittedAt < threeMonthsAgo) {
                            assessmentStatus = "Due"; // Expired/Recurring Due
                        }
                    } else {
                        const incomplete = await Assessment.findOne({ userId: registeredUser._id, isCompleted: false });
                        if (incomplete) assessmentStatus = "In Progress";
                    }

                } else {
                    // If no user found, check for assessment data (for employees who might have taken it without full account yet)
                    try {
                        const assessment = await Assessment.findOne({ invitationId: inv._id });
                        if (assessment) {
                            if (assessment.userDetails) {
                                const details = assessment.userDetails;
                                name = `${details.firstName || ""} ${details.lastName || ""}`.trim() || "Completed (Anonymous)";
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
                    assessmentStatus // Added field
                };
            })
        );

        // Stats
        const adminUser = await User.findOne({ orgName, role: "admin" });

        if (adminUser) {
            // Ensure Admin isn't already in the list via invitation
            const isAdminListed = formattedMembers.some(m => m.email === adminUser.email);

            if (!isAdminListed) {
                let adminAssessmentStatus = "Not Started";
                const adminAssessment = await Assessment.findOne({ userId: adminUser._id, isCompleted: true }).sort({ submittedAt: -1 });

                if (adminAssessment) {
                    adminAssessmentStatus = "Completed";
                    const threeMonthsAgo = new Date();
                    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
                    if (adminAssessment.submittedAt < threeMonthsAgo) {
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
