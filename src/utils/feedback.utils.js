import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let feedbackData = {};
try {
    const pathsToTry = [
        path.join(process.cwd(), "src", "data", "domainSubdomainFeedback.json"),
        path.join(process.cwd(), "data", "domainSubdomainFeedback.json"),
        path.resolve(__dirname, "../../src/data/domainSubdomainFeedback.json"),
        path.resolve(__dirname, "../data/domainSubdomainFeedback.json")
    ];

    let jsonPath = null;
    for (const p of pathsToTry) {
        if (fs.existsSync(p)) {
            jsonPath = p;
            break;
        }
    }

    if (jsonPath) {
        const rawContent = fs.readFileSync(jsonPath, 'utf8');
        feedbackData = JSON.parse(rawContent);
        console.log(`[Feedback Utils] SUCCESS: Loaded data from ${jsonPath}`);
    } else {
        console.error(`[Feedback Utils] ERROR: JSON not found. Paths checked: ${pathsToTry.join(', ')}`);
        console.error(`__dirname: ${__dirname}, cwd: ${process.cwd()}`);
    }
} catch (error) {
    console.error(`[Feedback Utils] CRITICAL: ${error.message}`);
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
    let reqRole = (role || 'leader').toLowerCase().trim();
    if (reqRole === 'superadmin') reqRole = 'admin';
    const normReqRole = robustNormalize(reqRole);

    // 1. Role Lookup (Match exactly or find first role if only 1 exists)
    const targetRoleKey = Object.keys(feedbackData).find(k => robustNormalize(k) === normReqRole) ||
        Object.keys(feedbackData).find(k => robustNormalize(k) === 'leader') ||
        Object.keys(feedbackData)[0];

    const roleData = feedbackData[targetRoleKey];
    if (!roleData) {
        console.error(`[Feedback] No role data found in JSON for role: ${reqRole}. Status: ${Object.keys(feedbackData).length} roles in DB.`);
        return null;
    }

    // ≡ƒöù Alias Mapping for inconsistent naming (Question vs Feedback Sheet)
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