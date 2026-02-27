
/**
 * Phase 1 Scoring Logic Utility
 */

export const getClassification = (score) => {
    if (score < 50) return "Low";
    if (score < 75) return "Medium";
    return "High";
};

/**
 * Converts a question response to a scale of 20, 40, 60, 80, 100
 */
export const convertToNumericScore = (response) => {
    const { scale, value } = response;

    if (scale === "SCALE_1_5" || scale === "NEVER_ALWAYS") {
        // Shift 1-5 to 20, 40, 60, 80, 100
        const numericVal = Number(value) || 1;
        return numericVal * 20;
    }

    if (scale === "FORCED_CHOICE") {
        // Higher maturity option = 100, Lower maturity option = 20
        const hvOption = response.higherValueOption || "A";
        return response.selectedOption === hvOption ? 100 : 20;
    }

    return 20;
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
