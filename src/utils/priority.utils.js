import { getClassification } from "./scoring.utils.js";
import { getSubdomainFeedback } from "./feedback.utils.js";

const truncate = (text, maxLen = 220) => {
    if (!text || typeof text !== "string") return "";
    const trimmed = text.trim();
    if (trimmed.length <= maxLen) return trimmed;
    const cut = trimmed.slice(0, maxLen);
    const lastSpace = cut.lastIndexOf(" ");
    return `${(lastSpace > 80 ? cut.slice(0, lastSpace) : cut).trim()}…`;
};

const firstStep = (text) => {
    if (!text || typeof text !== "string") return "";
    const line = text.split(/\n|(?=•)/).map((s) => s.trim().replace(/^[•\-*]\s*/, "")).find(Boolean);
    return line || text.trim();
};

/**
 * Converts teamAvg shape ({ domain: { avgScore, subdomains } }) to scores.domains shape.
 */
export const teamAvgToScores = (teamAvg = {}) => {
    const domains = {};
    for (const [domainName, domainData] of Object.entries(teamAvg)) {
        domains[domainName] = {
            score: domainData?.avgScore ?? 0,
            subdomains: domainData?.subdomains || {},
        };
    }
    return { domains };
};

/**
 * Ranks subdomains by score (lowest first) and attaches issue, impact, and recommended step.
 */
export const computeTopPriorities = ({
    scores,
    role = "admin",
    limit = 3,
} = {}) => {
    const entries = [];
    const domains = scores?.domains || {};

    for (const [domainName, domainData] of Object.entries(domains)) {
        const subdomains = domainData?.subdomains || {};
        for (const [subName, subScoreRaw] of Object.entries(subdomains)) {
            const score = typeof subScoreRaw === "object"
                ? Number(subScoreRaw?.score)
                : Number(subScoreRaw);

            if (Number.isNaN(score)) continue;

            const storedFb = domainData?.subdomainFeedback?.[subName];
            const fb = (storedFb?.insight ? storedFb : null) || getSubdomainFeedback(subName, score, role);
            const classification = getClassification(score);

            const impact = fb?.insight
                || `${subName} is underperforming relative to organizational expectations and may affect outcomes in ${domainName}.`;
            const recommendedStep = firstStep(fb?.modelDescription)
                || "Review current practices with your leadership team and define a focused 30-day improvement plan.";

            entries.push({
                rank: 0,
                domain: domainName,
                subdomain: subName,
                area: subName,
                score: Math.round(score),
                classification,
                issue: `${subName} — ${classification} performance (${Math.round(score)}%)`,
                impact: truncate(impact, 280),
                recommendedStep: truncate(recommendedStep, 200),
            });
        }
    }

    entries.sort((a, b) => a.score - b.score);

    return entries.slice(0, limit).map((item, idx) => ({ ...item, rank: idx + 1 }));
};
