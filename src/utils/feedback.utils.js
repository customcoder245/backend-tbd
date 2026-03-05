import { createRequire } from "module";

// Use createRequire so JSON imports work reliably in both dev and production
// (avoids fs.readFileSync path resolution issues in deployed environments)
const require = createRequire(import.meta.url);

let feedbackData = {};
try {
    const rawData = require("../data/domainSubdomainFeedback.json");
    // Handle cases where require might wrap JSON in a .default property
    feedbackData = rawData.default || rawData;
} catch (error) {
    console.error("Error loading subdomain feedback data:", error.message);
}


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
    if (!str) return "";
    return str.toString().toLowerCase().replace(/[^a-z0-9]/g, "");
};

/**
 * Retrieves the matching insight for a given subdomain, score, and role
 */
export const getSubdomainFeedback = (subdomainName, score, role) => {
    if (!subdomainName) return null;

    const level = getLevelFromScore(score);
    const normSubdomain = robustNormalize(subdomainName);

    // Map superAdmin to admin and ensure we have a fallback
    let normalizedRoleStr = (role || 'leader').toLowerCase();
    if (normalizedRoleStr === 'superadmin') normalizedRoleStr = 'admin';

    const normRole = robustNormalize(normalizedRoleStr);

    // Case-insensitive / Robust role lookup
    const targetRoleKey = Object.keys(feedbackData).find(k => robustNormalize(k) === normRole) ||
        Object.keys(feedbackData).find(k => robustNormalize(k) === 'leader'); // Fallback to leader

    const roleData = feedbackData[targetRoleKey];

    if (!roleData) {
        console.warn(`[Feedback] No feedback data found for role: "${normalizedRoleStr}" (norm: ${normRole})`);
        return null;
    }

    // Aggressive subdomain lookup
    const subdomainKey = Object.keys(roleData).find(k => robustNormalize(k) === normSubdomain);
    const subdomainData = roleData[subdomainKey];

    if (!subdomainData) {
        console.warn(`[Feedback] No feedback found for role "${targetRoleKey}" and subdomain: "${subdomainName}" (norm: ${normSubdomain})`);
        return null;
    }

    const result = subdomainData[level] || null;
    if (!result) {
        console.warn(`[Feedback] No feedback found for level "${level}" in subdomain "${subdomainName}"`);
    }

    return result;
};