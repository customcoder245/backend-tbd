import SubmittedAssessment from "../models/submittedAssessment.model.js";
import User from "../models/user.model.js";
import Invitation from "../models/invitation.model.js";
import mongoose from "mongoose";

/**
 * Shared helper to fetch the latest report for a user
 * Supports BOTH registered users (has User record) AND guest employees (invited, no account)
 */
const getLatestReportData = async (req, res, targetRole) => {
    try {
        const { userId: queryUserId, email: queryEmailPayload } = req.query;
        const loggedInUserId = req.user.userId;

        const userId = queryUserId || loggedInUserId;

        // Fetch target user 
        let targetUser = null;
        if (mongoose.Types.ObjectId.isValid(userId)) {
            targetUser = await User.findById(userId);
        }

        // --- FIRST CHECK IF THIS IS AN INVITATION ID (GUEST EMPLOYEE) ---
        let queryEmail = queryEmailPayload;
        let isGuest = false;
        if (!targetUser && queryUserId && mongoose.Types.ObjectId.isValid(queryUserId)) {
            const invite = await Invitation.findById(queryUserId);
            if (invite) {
                queryEmail = invite.email;
                isGuest = true;
            }
        }

        // --- GUEST EMPLOYEE PATH (no User account, identified by email) ---
        // The _id passed from orgUsers is the Invitation _id, not a User _id
        if (isGuest || queryEmail) {
            const requester = await User.findById(loggedInUserId);
            const rRole = requester?.role?.toLowerCase() || "";

            // Only superadmin, admin, leader, manager can view others' reports
            if (queryUserId && queryUserId !== loggedInUserId) {
                if (!["superadmin", "admin", "leader", "manager"].includes(rRole)) {
                    return res.status(403).json({ message: "Access denied.", hasReport: false });
                }
            }

            // Find assessment by email (case-insensitive)
            const emailRegex = new RegExp(`^${queryEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
            const report = await SubmittedAssessment.findOne({ "userDetails.email": emailRegex })
                .sort({ submittedAt: -1 })
                .lean();

            console.log(`[Dashboard] Guest path email lookup: ${report ? 'FOUND' : 'NOT FOUND'} for email=${queryEmail}`);

            if (!report) {
                return res.status(404).json({
                    message: "No completed assessment found for this person.",
                    hasReport: false
                });
            }

            const domainScoresArray = Object.values(report.scores?.domains || {});
            const avgScore = domainScoresArray.length > 0
                ? domainScoresArray.reduce((acc, d) => acc + (d.score || 0), 0) / domainScoresArray.length : 0;

            return res.status(200).json({
                report,
                user: report.userDetails,
                aiInsight: {
                    title: avgScore > 75 ? "Excellence Sustained" : avgScore < 50 ? "Opportunity for Shift" : "Performance Trajectory",
                    description: `Average score of ${Math.round(avgScore)}% across all domains.`,
                    type: avgScore > 75 ? "success" : avgScore < 50 ? "warning" : "info"
                },
                hasReport: true
            });
        }

        // --- REGISTERED USER PATH ---
        if (queryUserId && queryUserId !== loggedInUserId) {
            const requester = await User.findById(loggedInUserId);
            const rRole = requester?.role?.toLowerCase() || "";
            const tRole = targetUser?.role?.toLowerCase() || "";
            const rOrg = requester?.orgName;
            const tOrg = targetUser?.orgName;
            const rDept = requester?.department;
            const tDept = targetUser?.department;
            let isAllowed = false;
            if (rRole === "superadmin") isAllowed = true;
            else if (rRole === "admin") isAllowed = (rOrg === tOrg);
            else if (rRole === "leader") isAllowed = (rOrg === tOrg) && (rDept && rDept === tDept) && (["manager", "employee"].includes(tRole));
            else if (rRole === "manager") isAllowed = (rOrg === tOrg) && (rDept && rDept === tDept) && (tRole === "employee");
            if (!isAllowed) {
                return res.status(403).json({ message: "Access denied.", hasReport: false });
            }
        }

        // ─── REPORT LOOKUP: Multi-strategy fallback ───────────────────────────────
        let reports = [];

        // Strategy 1: Direct userId match
        reports = await SubmittedAssessment.find({ userId }).sort({ submittedAt: 1 }).lean();
        console.log(`[Dashboard] Strategy 1 (userId): FOUND ${reports.length} reports for userId=${userId}`);

        // Strategy 2: Email match (case-insensitive regex)
        if (reports.length === 0 && targetUser?.email) {
            const emailRegex = new RegExp(`^${targetUser.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
            reports = await SubmittedAssessment.find({ "userDetails.email": emailRegex }).sort({ submittedAt: 1 }).lean();
            console.log(`[Dashboard] Strategy 2 (email regex): FOUND ${reports.length} reports for email=${targetUser.email}`);
            if (reports.length > 0) {
                SubmittedAssessment.updateMany({ "userDetails.email": emailRegex }, { $set: { userId } }).catch(() => { });
            }
        }

        if (reports.length === 0) {
            console.log(`[Dashboard] No reports found for userId=${userId}, email=${targetUser?.email}`);
            return res.status(404).json({ message: "No completed assessment found for this user.", hasReport: false });
        }

        const latestReport = reports[reports.length - 1];
        const firstReport = reports[0];

        const domainScoresArray = Object.values(latestReport.scores.domains || {});
        const avgScore = domainScoresArray.length > 0
            ? domainScoresArray.reduce((acc, d) => acc + (d.score || 0), 0) / domainScoresArray.length : 0;

        let aiInsight = { title: "Performance Trajectory", description: `Average score of ${Math.round(avgScore)}%.`, type: "info" };
        if (avgScore > 75) aiInsight = { title: "Excellence Sustained", description: `Score of ${Math.round(avgScore)}% — high-performance zone.`, type: "success" };
        else if (avgScore < 50 && avgScore > 0) aiInsight = { title: "Opportunity for Shift", description: `Baseline score of ${Math.round(avgScore)}%. Focus on development.`, type: "warning" };

        res.status(200).json({
            report: latestReport,
            firstReport: firstReport,
            user: targetUser || latestReport.userDetails,
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

/**
 * 🆕 Detailed Domain Report API (NEW API)
 * Fetches specific feedback cards for a single domain (Insight, OKRs, Recommendations)
 * Used by Super Admin, Admin, and Leaders to view person-specific deep dives
 */
export const getDomainDetailedReport = async (req, res) => {
    try {
        const { userId: queryUserId, email: queryEmailPayload, domain, subdomain } = req.query;
        const loggedInUserId = req.user.userId;
        const userId = queryUserId || loggedInUserId;

        if (!domain) {
            return res.status(400).json({ message: "Domain name is required" });
        }

        // --- ACCESS CONTROL ---
        const requester = await User.findById(loggedInUserId);
        const rRole = requester?.role?.toLowerCase() || "";

        // Fetch target user 
        let targetUser = null;
        if (mongoose.Types.ObjectId.isValid(userId)) {
            targetUser = await User.findById(userId);
        }

        let queryEmail = queryEmailPayload;
        let isGuest = false;
        if (!targetUser && queryUserId && mongoose.Types.ObjectId.isValid(queryUserId)) {
            const invite = await Invitation.findById(queryUserId);
            if (invite) {
                queryEmail = invite.email;
                isGuest = true;
            }
        }

        // ─── ASSESSMENT LOOKUP ────────────────────────────────────────────────────
        let assessment = null;

        // Guest employee path: use email directly
        if (isGuest || queryEmail) {
            const emailRegex = new RegExp(`^${queryEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
            assessment = await SubmittedAssessment.findOne({ "userDetails.email": emailRegex }).sort({ submittedAt: -1 }).lean();
            console.log(`[DetailedInsight] Guest email lookup: ${assessment ? 'FOUND' : 'NOT FOUND'} for email=${queryEmail}`);
        } else {
            // Registered user path
            const isAllowed = !queryUserId || queryUserId === loggedInUserId || rRole === "superadmin" || (requester?.orgName && requester.orgName === targetUser?.orgName);
            if (!isAllowed) return res.status(403).json({ message: "Access denied." });

            assessment = await SubmittedAssessment.findOne({ userId }).sort({ submittedAt: -1 }).lean();
            console.log(`[DetailedInsight] Strategy 1 (userId): ${assessment ? 'FOUND' : 'not found'}`);

            if (!assessment && targetUser?.email) {
                const emailRegex = new RegExp(`^${targetUser.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
                assessment = await SubmittedAssessment.findOne({ "userDetails.email": emailRegex }).sort({ submittedAt: -1 }).lean();
                console.log(`[DetailedInsight] Strategy 2 (email regex): ${assessment ? 'FOUND' : 'not found'}`);
                if (assessment) SubmittedAssessment.updateOne({ _id: assessment._id }, { $set: { userId } }).catch(() => { });
            }
        }

        if (!assessment || !assessment.scores || !assessment.scores.domains) {
            return res.status(404).json({ message: "No scores found for this user.", hasReport: false });
        }

        const domainData = assessment.scores.domains[domain];
        if (!domainData) {
            return res.status(404).json({ message: `No data found for domain: ${domain}` });
        }

        // Check for specific subdomain feedback, otherwise fallback to domain-level feedback
        let feedback = {};
        if (subdomain && domainData.subdomainFeedback && domainData.subdomainFeedback[subdomain]) {
            feedback = domainData.subdomainFeedback[subdomain];
        } else {
            feedback = domainData.feedback || {};
        }

        const insightTitleLabel = subdomain ? `Insight for ${subdomain}` : `Insight for ${domain}`;

        // 1. Insights Pod (Domain analysis)
        const insightsPod = {
            title: insightTitleLabel,
            subtitle: "Overall analysis based on your responses",
            mainText: feedback.insight || `No specific insights available for ${subdomain || domain} yet.`,
            modelDescription: feedback.modelDescription || "",
            phase: feedback.phaseIndicator || ""
        };

        // 2. Objectives (OKRs) Pod - Derived from coaching tips
        let actionItems = [];
        if (feedback.coachingTips) {
            // Split string by newlines or bullets to create list items
            actionItems = feedback.coachingTips
                .split(/\r?\n|•/)
                .map(line => line.trim())
                .filter(line => line.length > 5 && !line.toUpperCase().includes("ADKAR FOCUS") && !line.toUpperCase().includes("STABILIZE & REBUILD") && !line.toUpperCase().includes("STANDARDIZE & ACCELERATE") && !line.toUpperCase().includes("SCALE & INSTITUTIONALIZE"));
        }

        const subdomainScore = (subdomain && domainData.subdomains && domainData.subdomains[subdomain])
            ? domainData.subdomains[subdomain]
            : domainData.score;

        const objectivesPod = {
            title: "Objectives And Key Results",
            subtitle: "Develop essential leadership and EI skills",
            items: actionItems.slice(0, 5), // Return top 5 clean items as KRs
            progress: Math.round(subdomainScore) || 0
        };

        // 3. Recommended Offering Pod
        let recommendations = [];
        if (feedback.recommendedPrograms) {
            recommendations = feedback.recommendedPrograms
                .split(/\r?\n|•/)
                .map(line => line.trim())
                .filter(line => line.length > 3 && !line.toUpperCase().includes("OCM TACTICS") && !line.toUpperCase().includes("RECOMMENDED"));
        }

        const recommendationsPod = {
            title: "Talent By Design Recommended Offering",
            subtitle: `Strategic recommendations for ${subdomain || domain}`,
            items: recommendations,
            icon: "offering"
        };

        res.status(200).json({
            domain,
            score: Math.round(domainData.score),
            pods: {
                insights: insightsPod,
                objectives: objectivesPod,
                recommendations: recommendationsPod
            },
            subdomains: domainData.subdomains || {}
        });

    } catch (error) {
        console.error("Error in getDomainDetailedReport:", error);
        res.status(500).json({ message: "Error fetching detailed report", error: error.message });
    }
};