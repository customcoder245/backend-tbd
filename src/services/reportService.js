import mongoose from 'mongoose';
import SubmittedAssessment from '../models/submittedAssessment.model.js';
import User from '../models/user.model.js';
import Invitation from '../models/invitation.model.js';
import { getClassification } from '../utils/scoring.utils.js';

const EXCLUDED_SECTION_KEYS = new Set(['overview']);

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const splitTextToItems = (value) => {
    if (!value || typeof value !== 'string') {
        return [];
    }

    return value
        .split(/\r?\n/)
        .map((line) => line.replace(/^[^A-Za-z0-9]+/, '').trim())
        .filter((line) => line.length > 2);
};

const resolveTargetContext = async (params) => {
    const {
        userId,
        email,
        loggedInUserId
    } = params;

    const resolvedUserId = userId || loggedInUserId;
    let targetUser = null;

    if (resolvedUserId && mongoose.Types.ObjectId.isValid(resolvedUserId)) {
        targetUser = await User.findById(resolvedUserId).lean();
    }

    let resolvedEmail = email || targetUser?.email || null;

    if (!targetUser && userId && mongoose.Types.ObjectId.isValid(userId)) {
        const invite = await Invitation.findById(userId).lean();
        if (invite?.email) {
            resolvedEmail = invite.email;
        }
    }

    return {
        resolvedUserId,
        resolvedEmail,
        targetUser
    };
};

const getLatestSubmittedAssessment = async ({ resolvedUserId, resolvedEmail, targetUser }) => {
    let report = null;

    if (resolvedUserId) {
        report = await SubmittedAssessment.findOne({ userId: resolvedUserId })
            .sort({ submittedAt: -1 })
            .lean();
    }

    if (!report && (resolvedEmail || targetUser?.email)) {
        const emailToMatch = resolvedEmail || targetUser.email;
        const emailRegex = new RegExp(`^${escapeRegex(emailToMatch)}$`, 'i');
        report = await SubmittedAssessment.findOne({ 'userDetails.email': emailRegex })
            .sort({ submittedAt: -1 })
            .lean();
    }

    return report;
};

const buildDomainSection = (domainName, domainData, selectedSubdomain) => {
    if (!domainData) {
        return null;
    }

    const effectiveScore = selectedSubdomain && domainData.subdomains?.[selectedSubdomain] != null
        ? domainData.subdomains[selectedSubdomain]
        : domainData.score;

    const effectiveFeedback = selectedSubdomain && domainData.subdomainFeedback?.[selectedSubdomain]
        ? domainData.subdomainFeedback[selectedSubdomain]
        : domainData.feedback || {};

    const title = selectedSubdomain
        ? `${domainName} - ${selectedSubdomain}`
        : domainName;

    return {
        key: selectedSubdomain || domainName,
        title,
        domainName,
        subdomainName: selectedSubdomain || '',
        score: Math.round(effectiveScore || 0),
        classification: getClassification(effectiveScore || 0),
        podTitle: effectiveFeedback.pod360Title || `Insight for ${selectedSubdomain || domainName}`,
        podSubtitle: effectiveFeedback.pod360Description || 'Assessment-based report insight',
        insight: effectiveFeedback.insight || `No insight available for ${selectedSubdomain || domainName}.`,
        modelDescription: effectiveFeedback.modelDescription || '',
        phase: effectiveFeedback.phaseIndicator || '',
        objectives: splitTextToItems(effectiveFeedback.coachingTips),
        recommendations: splitTextToItems(effectiveFeedback.recommendedPrograms),
        subdomains: Object.entries(domainData.subdomains || {}).map(([name, score]) => ({
            name,
            score: Math.round(score || 0),
            classification: getClassification(score || 0)
        }))
    };
};

const filterSectionsByTopics = (sections, selectedTopics = []) => {
    if (!Array.isArray(selectedTopics) || selectedTopics.length === 0) {
        return sections;
    }

    const normalized = selectedTopics.map((topic) => String(topic).trim().toLowerCase());

    return sections.filter((section) => {
        const keys = [
            section.key,
            section.title,
            section.domainName,
            section.subdomainName,
            section.podTitle
        ]
            .filter(Boolean)
            .map((value) => String(value).trim().toLowerCase());

        return normalized.some((topic) => keys.includes(topic) && !EXCLUDED_SECTION_KEYS.has(topic));
    });
};

export const getReportData = async ({
    userId,
    email,
    loggedInUserId,
    selectedDomain,
    selectedSubdomain,
    selectedTopics = []
}) => {
    const { resolvedUserId, resolvedEmail, targetUser } = await resolveTargetContext({
        userId,
        email,
        loggedInUserId
    });

    const report = await getLatestSubmittedAssessment({
        resolvedUserId,
        resolvedEmail,
        targetUser
    });

    if (!report) {
        return null;
    }

    const userDetails = targetUser || report.userDetails || {};
    const allDomains = report.scores?.domains || {};

    const baseSections = selectedDomain
        ? [buildDomainSection(selectedDomain, allDomains[selectedDomain], selectedSubdomain)].filter(Boolean)
        : Object.entries(allDomains)
            .map(([domainName, domainData]) => buildDomainSection(domainName, domainData))
            .filter(Boolean);

    const sections = filterSectionsByTopics(baseSections, selectedTopics);
    const overallScore = Math.round(report.scores?.overall || 0);
    const overallClassification = report.classification || getClassification(overallScore);

    return {
        report,
        user: userDetails,
        generatedAt: new Date().toISOString(),
        overallScore,
        overallClassification,
        aiInsight: report.customAiInsight || {
            title: overallScore >= 75 ? 'Excellence Sustained' : overallScore < 50 ? 'Opportunity for Shift' : 'Performance Trajectory',
            description: `Average score of ${overallScore}% across the latest submitted assessment.`,
            type: overallScore >= 75 ? 'success' : overallScore < 50 ? 'warning' : 'info'
        },
        sections,
        domainSummary: Object.entries(allDomains).map(([domainName, domainData]) => ({
            name: domainName,
            score: Math.round(domainData.score || 0),
            classification: getClassification(domainData.score || 0)
        }))
    };
};
