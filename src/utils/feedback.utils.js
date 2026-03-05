import { createRequire } from "module";

// Use createRequire so JSON imports work reliably in both dev and production
// (avoids fs.readFileSync path resolution issues in deployed environments)
const require = createRequire(import.meta.url);

let feedbackData = {};
try {
    feedbackData = require("../data/domainFeedback.json");
} catch (error) {
    console.error("Error loading domain feedback data:", error.message);
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
 * Retrieves the matching insight for a given domain, score, and role
 */
export const getDomainFeedback = (domainName, score, role) => {
    if (!domainName) return null;

    const level = getLevelFromScore(score);
    const cleanedName = domainName.trim();

    // Use the role name directly as we now have 4 roles in domainFeedback.json
    const targetRole = role || 'leader';
    const roleData = feedbackData[targetRole];

    if (!roleData) {
        console.warn(`[Feedback] No feedback data found for role: "${targetRole}"`);
        return null;
    }

    // Case-insensitive domain lookup
    const domainData = roleData[cleanedName] ||
        Object.entries(roleData).find(([key]) => key.toLowerCase() === cleanedName.toLowerCase())?.[1];

    if (!domainData) {
        console.warn(`[Feedback] No feedback found for role "${targetRole}" and domain: "${cleanedName}"`);
        return null;
    }

    return domainData[level] || null;
};