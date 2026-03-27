import SubmittedAssessment from "../models/submittedAssessment.model.js";
import User from "../models/user.model.js";
import Invitation from "../models/invitation.model.js";
import mongoose from "mongoose";

import PDFReportService from "../services/pdfReport.service.js";

/**
 * Shared helper to fetch the latest report for a user
 * Returns DATA instead of response if returnData is true
 */
const getLatestReportData = async (req, res, targetRole, returnData = false) => {
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

            const responseData = {
                report,
                user: report.userDetails,
                aiInsight: report.customAiInsight || {
                    title: avgScore > 75 ? "Excellence Sustained" : avgScore < 50 ? "Opportunity for Shift" : "Performance Trajectory",
                    description: `Average score of ${Math.round(avgScore)}% across all domains.`,
                    type: avgScore > 75 ? "success" : avgScore < 50 ? "warning" : "info"
                },
                hasReport: true
            };

            if (returnData) return responseData;
            return res.status(200).json(responseData);
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
        if (subdomain && domainData.subdomainFeedback) {
            // Try exact match first
            if (domainData.subdomainFeedback[subdomain]) {
                feedback = domainData.subdomainFeedback[subdomain];
            } else {
                // Try case-insensitive match
                const subKey = Object.keys(domainData.subdomainFeedback).find(
                    k => k.toLowerCase().trim() === subdomain.toLowerCase().trim()
                );
                if (subKey) {
                    feedback = domainData.subdomainFeedback[subKey];
                } else {
                    feedback = domainData.feedback || {};
                }
            }
        } else {
            feedback = domainData.feedback || {};
        }

        const insightTitleLabel = subdomain ? `Insight for ${subdomain}` : `Insight for ${domain}`;

        const filterBulletedLines = (text) => {
            if (!text) return "";
            const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
            const hasBullets = lines.some(line => line.includes('•'));

            if (!hasBullets) {
                return lines.join('\n');
            }

            return lines
                .filter(line => line.includes('•'))
                .map(line => line.replace(/•/g, '').trim())
                .filter(line => line.length > 0)
                .join('\n');
        };

        const getBulletedItems = (text) => {
            if (!text) return [];
            const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
            const hasBullets = lines.some(line => line.includes('•'));

            if (!hasBullets) {
                return lines;
            }

            return lines
                .filter(line => line.includes('•'))
                .map(line => line.replace(/•/g, '').trim())
                .filter(line => line.length > 0);
        };

        // 1. Insights Pod (Domain analysis)
        const insightsPod = {
            title: feedback.pod360Title || insightTitleLabel,
            subtitle: feedback.pod360Description || "Overall analysis based on your responses",
            mainText: filterBulletedLines(feedback.insight) || `No specific insights available for ${subdomain || domain} yet.`,
            modelDescription: filterBulletedLines(feedback.modelDescription) || "",
            phase: feedback.phaseIndicator || ""
        };

        // 2. Objectives (OKRs) Pod - Derived ONLY from manual objectives field
        const actionItems = getBulletedItems(feedback.objectives || "");

        const progressValue = (feedback.progressScore !== undefined && feedback.progressScore !== null)
            ? feedback.progressScore
            : 0;

        const objectivesPod = {
            title: "Objectives And Key Results",
            subtitle: "Develop essential leadership and EI skills",
            items: actionItems, // Return all items as KRs
            progress: progressValue || 0
        };

        // 3. Recommended Offering Pod
        const recommendations = getBulletedItems(feedback.recommendedPrograms);

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
                recommendations: recommendationsPod,
                rawFeedback: {
                    insight: feedback.insight || "",
                    coachingTips: feedback.coachingTips || "",
                    objectives: feedback.objectives || "",
                    progressScore: feedback.progressScore !== undefined ? feedback.progressScore : 0,
                    recommendedPrograms: feedback.recommendedPrograms || "",
                    pod360Title: feedback.pod360Title || "",
                    pod360Description: feedback.pod360Description || "",
                    modelDescription: feedback.modelDescription || ""
                }
            },
            subdomains: domainData.subdomains || {}
        });

    } catch (error) {
        console.error("Error in getDomainDetailedReport:", error);
        res.status(500).json({ message: "Error fetching detailed report", error: error.message });
    }
};

/**
 * 🆕 Update Detailed Domain Report API (NEW API)
 * Updates feedback cards for a single domain (Insight, OKRs, Recommendations)
 * Only usable by Super Admin
 */
export const updateDomainDetailedReport = async (req, res) => {
    try {
        const { userId: queryUserId, email: queryEmailPayload, domain, subdomain, insight, coachingTips, recommendedPrograms, pod360Title, pod360Description, modelDescription, objectives, progressScore } = req.body;
        const loggedInUserId = req.user.userId;
        const userId = queryUserId || loggedInUserId;

        if (!domain) {
            return res.status(400).json({ message: "Domain name is required" });
        }

        const requester = await User.findById(loggedInUserId);
        const userRole = requester?.role?.toLowerCase();
        const isAuthorized = userRole === "superadmin" || userRole === "super_admin" || userRole === "admin";

        if (!isAuthorized) {
            return res.status(403).json({ message: "Only Super Admin and Admin can update the report details." });
        }

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

        let assessment = null;
        if (isGuest || queryEmail) {
            const emailRegex = new RegExp(`^${queryEmail.replace(/[.*+?^${}()|[\\\]\\]/g, '\\\\$&')}$`, 'i');
            assessment = await SubmittedAssessment.findOne({ "userDetails.email": emailRegex }).sort({ submittedAt: -1 });
        } else {
            assessment = await SubmittedAssessment.findOne({ userId }).sort({ submittedAt: -1 });
            if (!assessment && targetUser?.email) {
                const emailRegex = new RegExp(`^${targetUser.email.replace(/[.*+?^${}()|[\\\]\\]/g, '\\\\$&')}$`, 'i');
                assessment = await SubmittedAssessment.findOne({ "userDetails.email": emailRegex }).sort({ submittedAt: -1 });
            }
        }

        // Identify orgName first (important if assessment is null)
        const orgName = assessment?.userDetails?.orgName || targetUser?.orgName || requester?.orgName;

        if (!assessment && !orgName) {
            return res.status(404).json({ message: "No assessment or organization found for this context." });
        }

        // --- PREPARE PAYLOAD ---
        const actualDomain = domain; // Fallback to provided domain
        const updatePayload = {};
        const prefix = subdomain
            ? `scores.domains.${actualDomain}.subdomainFeedback.${subdomain}`
            : `scores.domains.${actualDomain}.feedback`;

        if (insight !== undefined) updatePayload[`${prefix}.insight`] = insight;
        if (coachingTips !== undefined) updatePayload[`${prefix}.coachingTips`] = coachingTips;
        if (recommendedPrograms !== undefined) updatePayload[`${prefix}.recommendedPrograms`] = recommendedPrograms;
        if (pod360Title !== undefined) updatePayload[`${prefix}.pod360Title`] = pod360Title;
        if (pod360Description !== undefined) updatePayload[`${prefix}.pod360Description`] = pod360Description;
        if (modelDescription !== undefined) updatePayload[`${prefix}.modelDescription`] = modelDescription;
        if (objectives !== undefined) updatePayload[`${prefix}.objectives`] = objectives;
        if (progressScore !== undefined) updatePayload[`${prefix}.progressScore`] = progressScore;

        if (progressScore !== undefined && progressScore !== null) {
            const scorePath = subdomain
                ? `scores.domains.${actualDomain}.subdomains.${subdomain}`
                : `scores.domains.${actualDomain}.score`;
            updatePayload[scorePath] = progressScore;
        }

        // 1. Update individual assessment if it exists
        if (assessment) {
            // Re-find actual key for exact individual match (casing)
            const domainKey = (assessment.scores?.domains)
                ? Object.keys(assessment.scores.domains).find(k => k.toLowerCase().trim() === domain.toLowerCase().trim())
                : null;

            const currentActualDomain = domainKey || domain;
            const itemPrefix = subdomain ? `subdomainFeedback.${subdomain}` : `feedback`;

            if (!assessment.scores.domains[currentActualDomain]) assessment.scores.domains[currentActualDomain] = { score: 0 };
            const domainData = assessment.scores.domains[currentActualDomain];

            if (subdomain) {
                if (!domainData.subdomainFeedback) domainData.subdomainFeedback = {};
                if (!domainData.subdomainFeedback[subdomain]) domainData.subdomainFeedback[subdomain] = {};
                const subF = domainData.subdomainFeedback[subdomain];
                Object.assign(subF, { insight, coachingTips, recommendedPrograms, pod360Title, pod360Description, modelDescription, objectives, progressScore });
                if (progressScore !== undefined && progressScore !== null) {
                    if (!domainData.subdomains) domainData.subdomains = {};
                    domainData.subdomains[subdomain] = progressScore;
                }
            } else {
                if (!domainData.feedback) domainData.feedback = {};
                Object.assign(domainData.feedback, { insight, coachingTips, recommendedPrograms, pod360Title, pod360Description, modelDescription, objectives, progressScore });
                if (progressScore !== undefined && progressScore !== null) domainData.score = progressScore;
            }

            if (pod360Title || pod360Description) {
                if (!assessment.customAiInsight) assessment.customAiInsight = {};
                if (pod360Title) assessment.customAiInsight.title = pod360Title;
                if (pod360Description) assessment.customAiInsight.description = pod360Description;
                assessment.markModified('customAiInsight');
            }
            assessment.markModified('scores');
            await assessment.save();
        }

        // 2. Propagation Logic (Update EVERY person in the org)
        if (orgName && Object.keys(updatePayload).length > 0) {
            console.log(`[Propagation] Updating org: ${orgName} for domain: ${actualDomain}`);
            await SubmittedAssessment.updateMany(
                { "userDetails.orgName": orgName },
                { $set: updatePayload }
            );

            // Handle overall AI insight if provided
            if (pod360Title || pod360Description) {
                const aiUpdate = {};
                if (pod360Title) aiUpdate["customAiInsight.title"] = pod360Title;
                if (pod360Description) aiUpdate["customAiInsight.description"] = pod360Description;
                await SubmittedAssessment.updateMany(
                    { "userDetails.orgName": orgName },
                    { $set: aiUpdate }
                );
            }
        }

        res.status(200).json({ message: "Report details updated successfully for the entire organization." });
    } catch (error) {
        console.error("Error in updateDomainDetailedReport:", error);
        res.status(500).json({ message: "Error updating detailed report", error: error.message });
    }
};

/**
 * Shared helper to aggregate organization/team averages
 */
async function getOrganizationContextData(req, res) {
    const { userId: queryUserId, email: queryEmailPayload, includeSelf, department: queryDept } = req.query;
    const loggedInUserId = req.user.userId;
    const targetUserId = queryUserId || loggedInUserId;

    // 1. Identify the manager
    let managerUser = await User.findById(targetUserId);
    if (!managerUser && queryUserId && mongoose.Types.ObjectId.isValid(queryUserId)) {
        const invite = await Invitation.findById(queryUserId);
        if (invite) {
            managerUser = { email: invite.email, orgName: invite.orgName, department: invite.department };
        }
    }
    if (!managerUser) return null;

    const orgName = managerUser.orgName;
    const managerDept = (queryDept || managerUser.department || "").trim().toLowerCase();

    if (!orgName) return null;

    const safeOrg = orgName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const orgRegex = new RegExp(`^${safeOrg}$`, 'i');

    const [invitationDepts, userDepts, roles, invitations, registeredUsers] = await Promise.all([
        Invitation.distinct("department", { orgName: orgRegex }),
        User.distinct("department", { orgName: orgRegex }),
        Invitation.distinct("role", { orgName: orgRegex }),
        Invitation.countDocuments({ orgName: orgRegex }),
        User.countDocuments({ orgName: orgRegex, profileCompleted: true })
    ]);
    const depts = [...new Set([...invitationDepts, ...userDepts])];

    let allAssessments = await SubmittedAssessment.find({
        "userDetails.orgName": { $regex: orgRegex },
        isDeleted: { $ne: true }
    }).select("userId userDetails scores submittedAt").sort({ submittedAt: -1 }).lean();

    if (!includeSelf) {
        const managerEmail = (managerUser.email || "").toLowerCase();
        allAssessments = allAssessments.filter(a => (a.userDetails?.email || "").toLowerCase() !== managerEmail);
    }

    const latestByEmail = new Map();
    for (const a of allAssessments) {
        const email = (a.userDetails?.email || "").toLowerCase();
        if (!email) continue;
        const existing = latestByEmail.get(email);
        if (!existing || new Date(a.submittedAt) > new Date(existing.submittedAt)) {
            a._resolvedDept = (a.userDetails?.department || "").trim().toLowerCase();
            a._resolvedRole = (a.userDetails?.role || "employee").toLowerCase();
            latestByEmail.set(email, a);
        }
    }
    const uniqueAssessments = [...latestByEmail.values()];

    const deptAssessments = managerDept
        ? uniqueAssessments.filter(a => a._resolvedDept === managerDept)
        : uniqueAssessments;
    const orgBenchmarkAssessments = uniqueAssessments.filter(a =>
        managerDept ? (a._resolvedDept && a._resolvedDept !== managerDept) : true
    );

    const domainNames = ["People Potential", "Operational Steadiness", "Digital Fluency"];
    const aggregateDomainAvg = (assessmentList) => {
        const result = {};
        for (const domainName of domainNames) {
            const subTotals = {}, subCounts = {};
            let domainTotal = 0, domainCount = 0;
            for (const assessment of assessmentList) {
                const domainData = assessment.scores?.domains?.[domainName];
                if (!domainData) continue;
                if (typeof domainData.score === "number") { domainTotal += domainData.score; domainCount++; }
                for (const [subName, rawVal] of Object.entries(domainData.subdomains || {})) {
                    const score = typeof rawVal === "object" ? (rawVal?.score ?? 0) : (rawVal ?? 0);
                    if (!subTotals[subName]) { subTotals[subName] = 0; subCounts[subName] = 0; }
                    subTotals[subName] += score;
                    subCounts[subName]++;
                }
            }
            const avgSubdomains = {};
            for (const subName of Object.keys(subTotals)) {
                avgSubdomains[subName] = Number((subTotals[subName] / subCounts[subName]).toFixed(1));
            }
            result[domainName] = {
                avgScore: domainCount > 0 ? Number((domainTotal / domainCount).toFixed(1)) : 0,
                subdomains: avgSubdomains
            };
        }
        return result;
    };

    const employeeAssessments = deptAssessments.filter(a => a._resolvedRole === "employee");
    const managerAssessments = deptAssessments.filter(a => a._resolvedRole === "manager");
    const leaderAssessments = deptAssessments.filter(a => ["leader", "senior-leader"].includes(a._resolvedRole));

    return {
        teamAvg: aggregateDomainAvg(deptAssessments),
        orgAvg: aggregateDomainAvg(orgBenchmarkAssessments),
        employeeAvg: aggregateDomainAvg(employeeAssessments),
        managerAvg: aggregateDomainAvg(managerAssessments),
        leaderAvg: aggregateDomainAvg(leaderAssessments),
        memberCount: deptAssessments.length,
        employeeCount: employeeAssessments.length,
        managerCount: managerAssessments.length,
        leaderCount: leaderAssessments.length,
        orgMemberCount: orgBenchmarkAssessments.length,
        totalInvitations: invitations,
        acceptedInvitations: registeredUsers,
        pendingInvitations: Math.max(0, invitations - registeredUsers),
        department: managerDept,
        orgName,
        allDepartments: depts.filter(d => d && d.trim().length > 0)
    };
}

export const exportPdfReport = async (req, res) => {
    try {
        const { userId: queryUserId, email: queryEmailPayload } = req.query;

        // 1. Fetch Participant Data (if userId exists)
        let data = null;
        if (queryUserId || queryEmailPayload) {
            data = await getLatestReportData(req, res, "employee", true);
        }

        // 2. Fetch Organizational Comparison Data (regardless of userId)
        const comparisonData = await getOrganizationContextData(req, res);

        if (data && data.hasReport) {
            data.comparisonData = comparisonData;
        } else if (!queryUserId && !queryEmailPayload) {
            // No user selected => Generate MASTER ORG REPORT
            data = {
                isMasterReport: true,
                orgName: req.user.orgName || "Organization",
                comparisonData: comparisonData,
                user: req.user, // The Admin
                hasReport: true
            };
        }

        if (!data || !data.hasReport) {
            if (!res.headersSent) {
                return res.status(404).json({ message: "No report found to export." });
            }
            return;
        }

        const userName = data.isMasterReport
            ? `${data.orgName} Master Report`
            : `${data.user?.firstName || ""} ${data.user?.lastName || ""}`.trim() || data.user?.email || "Participant";

        const sanitizedUserName = userName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const fileName = `POD360_Export_${sanitizedUserName}_${new Date().toISOString().substring(0, 10)}.pdf`;

        // Set response headers for PDF download
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

        // Generate PDF and stream directly to response
        await PDFReportService.generateReport(data, res);

    } catch (error) {
        console.error("PDF Export Error:", error);
        if (!res.headersSent) {
            res.status(500).json({ message: "Failed to generate PDF report", error: error.message });
        }
    }
};

/**
 * 🆕 Report Preview API (FOR SUPER ADMIN)
 * Returns the PDF with 'inline' disposition so it can be viewed in browser iframe
 */
export const previewPdfReport = async (req, res) => {
    try {
        const { userId: queryUserId, email: queryEmailPayload, isMaster } = req.query;

        // Only superadmin allowed for live preview
        const requesterRole = req.user.role?.toLowerCase() || "";
        if (requesterRole !== "superadmin" && requesterRole !== "super_admin") {
            return res.status(403).json({ message: "Only Super Admin can access live preview." });
        }

        let data = null;
        if (isMaster === 'true') {
            const comparisonData = await getOrganizationContextData(req, res);
            data = {
                isMasterReport: true,
                orgName: req.user.orgName || "Organization",
                comparisonData: comparisonData,
                user: req.user,
                hasReport: true
            };
        } else {
            // Find a sample report if no specific user provided
            let targetUserId = queryUserId;
            let targetEmail = queryEmailPayload;

            if (!targetUserId && !targetEmail) {
                const sampleReport = await SubmittedAssessment.findOne({ isDeleted: { $ne: true } }).sort({ submittedAt: -1 }).lean();
                if (sampleReport) {
                    targetUserId = sampleReport.userId;
                    targetEmail = sampleReport.userDetails?.email;
                }
            }

            // Mock req.query for getLatestReportData if we found a sample
            const originalQuery = req.query;
            const mockReq = { ...req, query: { ...originalQuery, userId: targetUserId, email: targetEmail } };

            // We can't really "mock" req easily if getLatestReportData expects the real one, 
            // but we can pass the modified query.
            data = await getLatestReportData(mockReq, res, "employee", true);

            const comparisonData = await getOrganizationContextData(mockReq, res);
            if (data && data.hasReport) {
                data.comparisonData = comparisonData;
            }
        }

        if (!data || !data.hasReport) {
            return res.status(404).json({ message: "No report data found for preview. Please ensure at least one assessment exists in the system." });
        }

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "inline");

        await PDFReportService.generateReport(data, res);
    } catch (error) {
        console.error("PDF Preview Error:", error);
        if (!res.headersSent) {
            res.status(500).json({ message: "Failed to preview PDF report", error: error.message });
        }
    }
};

/**
 * 🆕 MANAGER TEAM AVERAGE API
 * Returns:
 *  - teamAvg  = avg subdomain scores of members in the SAME department as manager
 *  - orgAvg   = avg subdomain scores of members in OTHER departments (org benchmark)
 */
export const getManagerTeamAvg = async (req, res) => {
    try {
        const data = await getOrganizationContextData(req, res);
        if (!data) {
            return res.status(200).json({ teamAvg: {}, orgAvg: {}, memberCount: 0, orgMemberCount: 0 });
        }
        return res.status(200).json(data);
    } catch (error) {
        console.error("getManagerTeamAvg error:", error);
        res.status(500).json({ message: "Error fetching team averages", error: error.message });
    }
};
