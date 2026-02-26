
import fs from 'fs';

const content = fs.readFileSync('c:/Users/ST/OneDrive/Desktop/backend-tbd/src/scripts/seedQuestion.js', 'utf8');
const match = content.match(/const questions = (\[[\s\S]*?\]);/);
if (match) {
    try {
        const questions = JSON.parse(match[1]);
        console.log(`Total questions in JS: ${questions.length}`);

        const roles = {};
        const domains = {};
        questions.forEach(q => {
            roles[q.stakeholder] = (roles[q.stakeholder] || 0) + 1;
            domains[q.domain] = (domains[q.domain] || 0) + 1;
        });
        console.log("Roles:", roles);
        console.log("Domains:", domains);
    } catch (e) {
        console.log("Error parsing JSON:", e.message);
    }
} else {
    console.log("Could not find questions array.");
}
