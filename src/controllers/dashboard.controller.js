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

        // 2. Objectives (OKRs) Pod - Derived from coaching tips
        const actionItems = getBulletedItems(feedback.coachingTips);

        const subdomainScore = (subdomain && domainData.subdomains && domainData.subdomains[subdomain])
            ? domainData.subdomains[subdomain]
            : domainData.score;

        const objectivesPod = {
            title: "Objectives And Key Results",
            subtitle: "Develop essential leadership and EI skills",
            items: actionItems, // Return all items as KRs
            progress: Math.round(subdomainScore) || 0
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
        const { userId: queryUserId, email: queryEmailPayload, domain, subdomain, insight, coachingTips, recommendedPrograms, pod360Title, pod360Description, modelDescription } = req.body;
        const loggedInUserId = req.user.userId;
        const userId = queryUserId || loggedInUserId;

        if (!domain) {
            return res.status(400).json({ message: "Domain name is required" });
        }

        const requester = await User.findById(loggedInUserId);
        if (requester?.role?.toLowerCase() !== "superadmin" && requester?.role?.toLowerCase() !== "super_admin") {
            return res.status(403).json({ message: "Only Super Admin can update the report details." });
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
            const emailRegex = new RegExp(`^${queryEmail.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}$`, 'i');
            assessment = await SubmittedAssessment.findOne({ "userDetails.email": emailRegex }).sort({ submittedAt: -1 });
        } else {
            assessment = await SubmittedAssessment.findOne({ userId }).sort({ submittedAt: -1 });
            if (!assessment && targetUser?.email) {
                const emailRegex = new RegExp(`^${targetUser.email.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}$`, 'i');
                assessment = await SubmittedAssessment.findOne({ "userDetails.email": emailRegex }).sort({ submittedAt: -1 });
            }
        }

        if (!assessment || !assessment.scores || !assessment.scores.domains) {
            return res.status(404).json({ message: "No scores found for this user." });
        }

        let domainData = assessment.scores.domains[domain];
        if (!domainData) {
            return res.status(404).json({ message: `No data found for domain: ${domain}` });
        }

        if (subdomain) {
            if (!domainData.subdomainFeedback) domainData.subdomainFeedback = {};
            if (!domainData.subdomainFeedback[subdomain]) domainData.subdomainFeedback[subdomain] = {};
            domainData.subdomainFeedback[subdomain].insight = insight;
            domainData.subdomainFeedback[subdomain].coachingTips = coachingTips;
            domainData.subdomainFeedback[subdomain].recommendedPrograms = recommendedPrograms;
            domainData.subdomainFeedback[subdomain].pod360Title = pod360Title;
            domainData.subdomainFeedback[subdomain].pod360Description = pod360Description;
            domainData.subdomainFeedback[subdomain].modelDescription = modelDescription;
        } else {
            if (!domainData.feedback) domainData.feedback = {};
            domainData.feedback.insight = insight;
            domainData.feedback.coachingTips = coachingTips;
            domainData.feedback.recommendedPrograms = recommendedPrograms;
            domainData.feedback.pod360Title = pod360Title;
            domainData.feedback.pod360Description = pod360Description;
            domainData.feedback.modelDescription = modelDescription;
        }
        if (pod360Title || pod360Description) {
            if (!assessment.customAiInsight) assessment.customAiInsight = {};
            if (pod360Title) assessment.customAiInsight.title = pod360Title;
            if (pod360Description) assessment.customAiInsight.description = pod360Description;
            assessment.markModified('customAiInsight');
        }

        assessment.markModified('scores');
        await assessment.save();

        res.status(200).json({ message: "Report details updated successfully." });
    } catch (error) {
        console.error("Error in updateDomainDetailedReport:", error);
        res.status(500).json({ message: "Error updating detailed report", error: error.message });
    }
};

/**
 * 🆕 EXPORT PDF REPORT (NEW API)
 * Generates a professional 7-page PDF report for a user
 */
export const exportPdfReport = async (req, res) => {
    try {
        const { userId: queryUserId, email: queryEmailPayload } = req.query;
        // Use existing report fetching logic but get data instead of JSON response
        const data = await getLatestReportData(req, res, "employee", true);

        if (!data || !data.hasReport) {
            return res.status(404).json({ message: "No report found to export." });
        }

        const userName = `${data.user?.firstName || ""} ${data.user?.lastName || ""}`.trim() || data.user?.email || "Participant";
        const sanitizedUserName = userName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const fileName = `POD360_Report_${sanitizedUserName}_${new Date().toISOString().substring(0, 10)}.pdf`;

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
 * 🆕 MANAGER TEAM AVERAGE API
 * Returns:
 *  - teamAvg  = avg subdomain scores of members in the SAME department as manager
 *  - orgAvg   = avg subdomain scores of members in OTHER departments (org benchmark)
 */
export const getManagerTeamAvg = async (req, res) => {
    try {
        const { userId: queryUserId, email: queryEmailPayload, includeSelf } = req.query;
        const loggedInUserId = req.user.userId;
        const targetUserId = queryUserId || loggedInUserId;

        // 1. Identify the manager
        let managerUser = null;
        if (mongoose.Types.ObjectId.isValid(targetUserId)) {
            managerUser = await User.findById(targetUserId).lean();
        }
        if (!managerUser && queryEmailPayload) {
            managerUser = await User.findOne({ email: queryEmailPayload.toLowerCase() }).lean();
        }
        if (!managerUser) {
            return res.status(200).json({ teamAvg: {}, orgAvg: {}, memberCount: 0, orgMemberCount: 0 });
        }

        const managerDept = (req.query.department || managerUser.department || "").trim().toLowerCase();
        const orgName = managerUser.orgName;

        if (!orgName) {
            return res.status(200).json({ teamAvg: {}, orgAvg: {}, memberCount: 0, orgMemberCount: 0 });
        }

        // 2. Regex for org name
        const safeOrg = orgName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const orgRegex = new RegExp(`^${safeOrg}$`, 'i');

        // 3. Directly fetch ALL assessments for this organization
        // We rely entirely on the userDetails stored in the assessment submission.
        let allAssessments = await SubmittedAssessment.find({
            "userDetails.orgName": { $regex: orgRegex }
        }).select("userId userDetails scores submittedAt").sort({ submittedAt: -1 }).lean();

        // 5. Exclude the manager themselves unless includeSelf is true
        if (!includeSelf) {
            const managerEmail = managerUser.email.toLowerCase();
            allAssessments = allAssessments.filter(a => {
                const aEmail = (a.userDetails?.email || "").toLowerCase();
                return aEmail !== managerEmail;
            });
        }

        // 5. De-duplicate: keep only the LATEST assessment per person (by email)
        //    and resolve each person's department
        const latestByEmail = new Map();
        for (const a of allAssessments) {
            const email = (a.userDetails?.email || "").toLowerCase();
            if (!email) continue;
            const existing = latestByEmail.get(email);
            if (!existing || new Date(a.submittedAt) > new Date(existing.submittedAt)) {
                // Use data stored in the assessment itself, exactly as the user requested
                a._resolvedDept = (a.userDetails?.department || "").trim().toLowerCase();
                a._resolvedRole = (a.userDetails?.role || "employee").toLowerCase();
                latestByEmail.set(email, a);
            }
        }
        const uniqueAssessments = [...latestByEmail.values()];

        // 7. Split into: SAME dept (team) vs OTHER depts (org benchmark)
        const deptAssessments = managerDept
            ? uniqueAssessments.filter(a => a._resolvedDept === managerDept)
            : uniqueAssessments; // Fallback: all org members if dept is blank
        const orgBenchmarkAssessments = uniqueAssessments.filter(a =>
            managerDept ? (a._resolvedDept && a._resolvedDept !== managerDept) : true
        );

        // 8. Aggregate helper
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
        const leaderAssessments = deptAssessments.filter(a => ["leader", "senior-leader", "senior_leader"].includes(a._resolvedRole));
        const adminAssessments = deptAssessments.filter(a => ["admin", "superadmin", "super_admin"].includes(a._resolvedRole));

        return res.status(200).json({
            teamAvg: aggregateDomainAvg(deptAssessments),       // same-dept members (combined)
            orgAvg: aggregateDomainAvg(orgBenchmarkAssessments), // other-dept org benchmark
            employeeAvg: aggregateDomainAvg(employeeAssessments), // same-dept ONLY employees
            managerAvg: aggregateDomainAvg(managerAssessments),   // same-dept ONLY managers
            leaderAvg: aggregateDomainAvg(leaderAssessments),     // same-dept ONLY leaders
            adminAvg: aggregateDomainAvg(adminAssessments),       // same-dept ONLY admins
            memberCount: deptAssessments.length,
            orgMemberCount: orgBenchmarkAssessments.length,
            employeeCount: employeeAssessments.length,
            managerCount: managerAssessments.length,
            leaderCount: leaderAssessments.length,
            adminCount: adminAssessments.length,
            department: managerUser.department || "",
            allDepartments: [...new Set(uniqueAssessments.map(a => a._resolvedDept).filter(Boolean))],
            orgName
        });

    } catch (error) {
        console.error("getManagerTeamAvg error:", error);
        res.status(500).json({ message: "Error fetching team averages", error: error.message });
    }
};
