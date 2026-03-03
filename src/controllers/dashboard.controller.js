import SubmittedAssessment from "../models/submittedAssessment.model.js";
import User from "../models/user.model.js";
import mongoose from "mongoose";

/**
 * Shared helper to fetch the latest report for a user
 */
const getLatestReportData = async (req, res, targetRole) => {
    try {
        const { userId: queryUserId } = req.query; // For Admin/Coach viewing others
        const loggedInUserId = req.user.userId;

        // Determine which user we're looking at
        const userId = queryUserId || loggedInUserId;

        // --- ACCESS CONTROL CHECK ---
        if (queryUserId && queryUserId !== loggedInUserId) {
            const requester = await User.findById(loggedInUserId);
            const targetUser = await User.findById(userId);

            if (!targetUser) {
                return res.status(404).json({ message: "Target user not found" });
            }

            const rRole = requester?.role?.toLowerCase() || "";
            const tRole = targetUser?.role?.toLowerCase() || "";
            const rOrg = requester?.orgName;
            const tOrg = targetUser?.orgName;
            const rDept = requester?.department;
            const tDept = targetUser?.department;

            let isAllowed = false;

            if (rRole === "superadmin") {
                isAllowed = true;
            } else if (rRole === "admin") {
                // Admin can see everyone in their organization
                isAllowed = (rOrg === tOrg);
            } else if (rRole === "leader") {
                // Leader can see Managers and Employees in their Organization AND Department
                isAllowed = (rOrg === tOrg) && (rDept && rDept === tDept) && (["manager", "employee"].includes(tRole));
            } else if (rRole === "manager") {
                // Manager can see only Employees in their Organization AND Department
                isAllowed = (rOrg === tOrg) && (rDept && rDept === tDept) && (tRole === "employee");
            }

            if (!isAllowed) {
                return res.status(403).json({
                    message: "Access denied. You can only view members within your organization and department according to your role permissions.",
                    hasReport: false
                });
            }
        }

        // Find the latest completed assessment for this user
        const report = await SubmittedAssessment.findOne({ userId })
            .sort({ submittedAt: -1 }) // Get the most recent
            .lean();

        if (!report) {
            return res.status(404).json({
                message: "No completed assessment found for this user.",
                hasReport: false
            });
        }

        // Fetch user details for the report header (if not already in snapshot)
        const user = await User.findById(userId).select("firstName lastName department role orgName").lean();

        // Calculate an AI-style insight for the report
        const domainScoresArray = Object.values(report.scores.domains || {});
        const avgScore = domainScoresArray.length > 0
            ? domainScoresArray.reduce((acc, d) => acc + (d.score || 0), 0) / domainScoresArray.length
            : 0;

        let aiInsight = {
            title: "Performance Trajectory",
            description: `You're currently maintaining an average score of ${Math.round(avgScore)}% across all domains. Maintaining focus here will stabilize your professional growth path.`,
            type: "info"
        };

        if (avgScore > 75) {
            aiInsight = {
                title: "Excellence Sustained",
                description: `Impressive agility! Your score of ${Math.round(avgScore)}% indicates you are operating in a high-performance zone. Lean into your strengths to lead others.`,
                type: "success"
            };
        } else if (avgScore < 50 && avgScore > 0) {
            aiInsight = {
                title: "Opportunity for Shift",
                description: `Current indicators suggest a baseline score of ${Math.round(avgScore)}%. This is a prime moment to pivot and focus on foundational skill development in your target areas.`,
                type: "warning"
            };
        }

        res.status(200).json({
            report,
            user: user || report.userDetails,
            aiInsight,
            hasReport: true
        });
    } catch (error) {
        console.error(`Error fetching ${targetRole} report:`, error);
        res.status(500).json({ message: "Error fetching report data", error: error.message });
    }
};

export const employeeReport = async (req, res) => {
    return getLatestReportData(req, res, "employee");
}

export const managerReport = async (req, res) => {
    return getLatestReportData(req, res, "manager");
}

export const LeaderReport = async (req, res) => {
    return getLatestReportData(req, res, "leader");
}

export const AdminReport = async (req, res) => {
    return getLatestReportData(req, res, "admin/superAdmin");
}