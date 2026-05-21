import fs from 'fs';

const rawData = JSON.parse(fs.readFileSync('org_feedback.json', 'utf8'));

const orgHealthFeedback = {};

rawData.forEach(row => {
    const domain = row['Domain'];
    const subDomain = row['Sub-Domain'];
    const scoreBand = row['Score Band'];
    
    if (!orgHealthFeedback[subDomain]) {
        orgHealthFeedback[subDomain] = {};
    }
    
    orgHealthFeedback[subDomain][scoreBand] = {
        insight: row['Insights'] || "",
        modelDescription: row['POD-360 Model Insight'] || "",
        coachingTips: row['Dashboard Dial Interpretation'] ? `• ${row['Dashboard Dial Interpretation']}` : "", 
        recommendedPrograms: "",
        objectives: "",
        domain: domain
    };
});

let feedbackFileContent = fs.readFileSync('src/data/domainSubdomainFeedback.js', 'utf8');

// Find the last "  }\n};" or "  }\r\n};"
const injectionPointRegex = /  \}\r?\n\};\r?\n\r?\nexport default feedbackData;/;

const stringifiedOrg = JSON.stringify(orgHealthFeedback, null, 4).split('\n').map(l => '  ' + l).join('\n');

const newContent = feedbackFileContent.replace(injectionPointRegex, `  },\n  "organizational_health": ${stringifiedOrg.trim()}\n};\n\nexport default feedbackData;`);

fs.writeFileSync('src/data/domainSubdomainFeedback.js', newContent);
console.log('Appended organizational_health to domainSubdomainFeedback.js');
