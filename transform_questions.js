import fs from 'fs';

const data = JSON.parse(fs.readFileSync('questions_v2.json', 'utf8'));

const transformed = data.map(q => {
    const base = {
        stakeholder: q.stakeholder,
        domain: q.domain,
        subdomain: q.subdomain,
        questionType: q.questionType,
        questionCode: q.questionCode,
        questionStem: q.questionStem,
        scale: q.scale,
        insightPrompt: q.insightPrompt || null,
        subdomainWeight: q.subdomainWeight,
        isDeleted: false,
        orgName: null,
        order: q.order
    };

    if (q.questionType === 'Forced-Choice' || q.scale === 'FORCED_CHOICE') {
        base.forcedChoice = {
            optionA: {
                label: q.fc_optionA_label,
                insightPrompt: q.fc_optionA_insightPrompt
            },
            optionB: {
                label: q.fc_optionB_label,
                insightPrompt: q.fc_optionB_insightPrompt
            },
            higherValueOption: 'B' // Defaulting to B, as score is 50-50 now
        };
        base.insightPrompt = null;
    }

    return base;
});

const output = `const questions = ${JSON.stringify(transformed, null, 2)};`;
fs.writeFileSync('new_questions_array.txt', output);
console.log('Generated new_questions_array.txt');
