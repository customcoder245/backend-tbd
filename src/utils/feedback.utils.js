import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let feedbackData = {};
try {
    const jsonPath = path.resolve(__dirname, "../data/domainSubdomainFeedback.json");
    console.log(`[Feedback Utils] Loading data from: ${jsonPath}`);
    if (fs.existsSync(jsonPath)) {
        const rawContent = fs.readFileSync(jsonPath, 'utf8');
        feedbackData = JSON.parse(rawContent);
        console.log(`[Feedback Utils] Successfully loaded ${Object.keys(feedbackData).length} roles.`);
    } else {
        console.error(`[Feedback Utils] JSON file not found at ${jsonPath}`);
    }
} catch (error) {
    console.error(`[Feedback Utils] CRITICAL: Failed to load feedback JSON: ${error.message}`);
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
    let normalizedRoleStr = (role || 'leader').toLowerCase().trim();
    if (normalizedRoleStr === 'superadmin') normalizedRoleStr = 'admin';
    const normRole = robustNormalize(normalizedRoleStr);

    // 1. Role Lookup
    const targetRoleKey = Object.keys(feedbackData).find(k => robustNormalize(k) === normRole) ||
        Object.keys(feedbackData).find(k => robustNormalize(k) === 'leader');

    const roleData = feedbackData[targetRoleKey];
    if (!roleData) {
        console.warn(`[Feedback] No role data for "${normRole}" or fallback "leader"`);
        return null;
    }

    // 🔗 Alias Mapping for inconsistent naming (Question vs Feedback Sheet)
    const aliases = {
        "mindsetadaptability": ["mindsetconfidenceandchangereadiness", "adaptability"],
        "mindsetconfidenceandchangereadiness": ["mindsetadaptability", "adaptability"],
        "mindsetconfidencechangereadiness": ["mindsetadaptability", "adaptability"],
        "effectiveresourcemanagement": ["workflowclarity", "prioritization"]
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

    // 3. Global Fallback: If not found in current role, try in 'leader' role (it has most subdomains)
    if (!subdomainKey && targetRoleKey !== 'leader') {
        const leaderData = feedbackData['leader'] || {};
        subdomainKey = Object.keys(leaderData).find(k => robustNormalize(k) === normSubdomain);
        if (subdomainKey) {
            console.log(`[Feedback] Fallback used leader data for sub: "${subdomainName}" for role: "${targetRoleKey}"`);
            const fb = leaderData[subdomainKey]?.[level];
            return fb || null;
        }
    }

    const subdomainData = roleData[subdomainKey];
    if (!subdomainData) {
        console.warn(`[Feedback] Missing: Role[${targetRoleKey}] Sub[${subdomainName}] (Norm: ${normSubdomain})`);
        return null;
    }

    const result = subdomainData[level] || null;
    if (!result) {
        console.warn(`[Feedback] Missing Level: Role[${targetRoleKey}] Sub[${subdomainKey}] Level[${level}]`);
    }

    return result;
};