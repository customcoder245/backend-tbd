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
 * Retrieves the matching insight for a given domain and score
 */
export const getDomainFeedback = (domainName, score) => {
    const level = getLevelFromScore(score);
    return feedbackData[domainName]?.[level] || null;
};