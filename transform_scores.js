
import Assessment from "./src/models/assessment.model.js";
import User from "./src/models/user.model.js";
import SubmittedAssessment from "./src/models/submittedAssessment.model.js";
import Response from "./src/models/response.model.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { calculateAssessmentScores } from "./src/utils/scoring.utils.js";
import { getSubdomainFeedback } from "./src/utils/feedback.utils.js";

dotenv.config();

const run = async () => {
    try {
        console.log("Connecting to DB...");
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("Connected.");

        const assessments = await SubmittedAssessment.find().sort({ submittedAt: -1 });
        console.log(`Found ${assessments.length} assessments to check.`);

        for (const sa of assessments) {
            console.log(`Processing ${sa._id} for role ${sa.stakeholder || sa.userDetails?.role}`);

            const role = sa.stakeholder || sa.userDetails?.role || 'employee';

            // Use the scores we already have if possible, but let's re-run the feedback logic
            const scores = JSON.parse(JSON.stringify(sa.scores));

            let fbCount = 0;
            for (const domainName in scores.domains) {
                const domainObj = scores.domains[domainName];
                domainObj.subdomainFeedback = {};

                let minScore = 101;
                let minSubName = null;

                for (const subName in domainObj.subdomains) {
                    const subScore = domainObj.subdomains[subName];

                    if (subScore < minScore) {
                        minScore = subScore;
                        minSubName = subName;
                    }

                    const subFb = getSubdomainFeedback(subName, subScore, role);
                    if (subFb) {
                        fbCount++;
                        domainObj.subdomainFeedback[subName] = subFb;
                    } else {
                        console.warn(`      - No feedback found for subdomain: ${subName} (score: ${subScore}, role: ${role})`);
                    }
                }

                if (minSubName) {
                    domainObj.feedback = getSubdomainFeedback(minSubName, minScore, role);
                }
            }

            sa.scores = scores;
            sa.markModified('scores');
            await sa.save();
            console.log(`   - Saved ${sa._id}. Feedback entries added: ${fbCount}`);
        }

        console.log("Transformation complete.");
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
};

run();
