
/**
 * Phase 1 Scoring Logic Utility
 */

export const getClassification = (score) => {
    if (score < 2.5) return "Low";
    if (score < 3.75) return "Medium";
    return "High";
};

/**
 * Converts a question response to a 1-5 numeric scale
 */
export const convertToNumericScore = (response) => {
    const { scale, value, selectedOption } = response;

    if (scale === "SCALE_1_5" || scale === "NEVER_ALWAYS") {
        // These are already saved as 1-5 integers in the value field generally
        // But we ensure it's a number
        return Number(value) || 1;
    }

    if (scale === "FORCED_CHOICE") {
        // Phase 1: Higher maturity option = 5, Lower maturity option = 1
        // We compare selectedOption with the higherValueOption stored in the response record
        const hvOption = response.higherValueOption || "A";
        return response.selectedOption === hvOption ? 5 : 1;
    }

    return 1;
};

/**
 * Calculates all scores for an assessment session
 * responses: array of Response objects
 */
export const calculateAssessmentScores = (responses) => {
    if (!responses || responses.length === 0) {
        return { overall: 0, domains: {}, classification: "Low" };
    }

    const domainMap = {};

    // 1. Group by Domain and Sub-Domain
    responses.forEach((res) => {
        const domain = res.domain;
        const subdomain = res.subdomain;
        const score = convertToNumericScore(res);

        if (!domainMap[domain]) {
            domainMap[domain] = {
                subdomains: {}
            };
        }

        if (!domainMap[domain].subdomains[subdomain]) {
            domainMap[domain].subdomains[subdomain] = {
                totalScore: 0,
                count: 0
            };
        }

        domainMap[domain].subdomains[subdomain].totalScore += score;
        domainMap[domain].subdomains[subdomain].count += 1;
    });

    // 2. Step 1: Calculate Sub-Domain Scores (Average of Questions)
    const finalScores = {
        overall: 0,
        domains: {}
    };

    const domainScoresList = [];

    for (const domainName in domainMap) {
        const subdomainsData = domainMap[domainName].subdomains;
        const subDomainScores = {};
        const subDomainScoresList = [];

        for (const subName in subdomainsData) {
            const { totalScore, count } = subdomainsData[subName];
            const avg = count > 0 ? totalScore / count : 0;
            subDomainScores[subName] = avg;
            subDomainScoresList.push(avg);
        }

        // 3. Step 2: Calculate Domain Score (Average of Sub-Domains)
        const domainAvg = subDomainScoresList.length > 0
            ? subDomainScoresList.reduce((a, b) => a + b, 0) / subDomainScoresList.length
            : 0;

        finalScores.domains[domainName] = {
            score: domainAvg,
            subdomains: subDomainScores
        };

        domainScoresList.push(domainAvg);
    }

    // 4. Step 3: Overall Score (Average of Domains)
    // User says 3 domains, but we average whatever domains exist
    finalScores.overall = domainScoresList.length > 0
        ? domainScoresList.reduce((a, b) => a + b, 0) / domainScoresList.length
        : 0;

    return {
        scores: finalScores,
        classification: getClassification(finalScores.overall)
    };
};
