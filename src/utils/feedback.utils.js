import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
 
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
 
let feedbackData = {};
try {
    const filePath = path.join(__dirname, "../data/domainFeedback.json");
    if (fs.existsSync(filePath)) {
        feedbackData = JSON.parse(fs.readFileSync(filePath, "utf8"));
    } else {
        console.warn(`Warning: ${filePath} not found. Domain feedback will be unavailable.`);
    }
} catch (error) {
    console.error("Error loading domain feedback data:", error);
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