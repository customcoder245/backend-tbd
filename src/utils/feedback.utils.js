import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
// 🚀 Importing as JS module is 100% reliable for Vercel
import { feedbackData } from "../data/domainSubdomainFeedback.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log(`[Feedback Utils] SUCCESS: Data loaded via direct import. Total roles: ${Object.keys(feedbackData).length}`);

/**
 * Maps a numeric score (0-100) to the corresponding feedback level
 */
export const getLevelFromScore = (score) => {
    if (score < 50) return "Low";
    if (score < 75) return "Medium";
    return "High";
};

/**
 * Normalizes a string for robust comparison (lowercase, alphanumeric only)
 */
const robustNormalize = (str) => {
    if (str === null || str === undefined) return "";
    return str.toString().toLowerCase().trim().replace(/[^a-z0-9]/g, "");
};

/**
 * Retrieves the matching insight for a given subdomain, score, and role
 */
export const getSubdomainFeedback = (subdomainName, score, role) => {
    if (!subdomainName) return null;

    const level = getLevelFromScore(score);
    const normSubdomain = robustNormalize(subdomainName);

    // Map roles correctly
    let reqRole = (role || 'leader').toLowerCase().trim();
    if (reqRole === 'superadmin') reqRole = 'admin';
    const normReqRole = robustNormalize(reqRole);

    // 1. Role Lookup (Match exactly or find first role if only 1 exists)
    const targetRoleKey = Object.keys(feedbackData).find(k => robustNormalize(k) === normReqRole) ||
        Object.keys(feedbackData).find(k => robustNormalize(k) === 'leader') ||
        Object.keys(feedbackData)[0];

    const roleData = feedbackData[targetRoleKey];
    if (!roleData) {
        console.error(`[Feedback] No role data found for role: ${reqRole}`);
        return null;
    }

    // 🔗 Alias Mapping for inconsistent naming (Question vs Feedback Sheet)
    const aliases = {
        "mindsetadaptability": ["mindsetconfidenceandchangereadiness", "mindsetconfidenceandchangereadiness", "mindsetconfidencechangereadiness", "adaptability"],
        "mindsetconfidenceandchangereadiness": ["mindsetadaptability", "mindsetconfidenceandchangereadiness", "mindsetconfidencechangereadiness", "adaptability"],
        "mindsetconfidencechangereadiness": ["mindsetadaptability", "mindsetconfidenceandchangereadiness", "mindsetconfidencechangereadiness", "adaptability"],
        "effectiveresourcemanagement": ["workflowclarity", "prioritization", "resourceefficiency"],
        "datacentriccultureandaiadoption": ["dataaiandautomationreadiness", "datareadiness"],
        "dataaiandautomationreadiness": ["datacentriccultureandaiadoption", "datareadiness"]
    };

    // 2. Subdomain Lookup
    let subdomainKey = Object.keys(roleData).find(k => robustNormalize(k) === normSubdomain);

    // Try aliases if not found direct
    if (!subdomainKey && aliases[normSubdomain]) {
        for (const alias of aliases[normSubdomain]) {
            subdomainKey = Object.keys(roleData).find(k => robustNormalize(k) === alias);
            if (subdomainKey) break;
        }
    }

    // 3. Global Fallback: If not found in current role, try in 'leader' role
    if (!subdomainKey && targetRoleKey !== 'leader') {
        const leaderData = feedbackData['leader'] || {};
        subdomainKey = Object.keys(leaderData).find(k => robustNormalize(k) === normSubdomain);
        if (subdomainKey) {
            const fb = leaderData[subdomainKey]?.[level];
            return fb || null;
        }
    }

    const subdomainData = roleData[subdomainKey];
    if (!subdomainData) return null;

    return subdomainData[level] || null;
};
