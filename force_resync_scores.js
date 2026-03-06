import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "./src/db/index.js";
import SubmittedAssessment from "./src/models/submittedAssessment.model.js";
import { getSubdomainFeedback } from "./src/utils/feedback.utils.js";
import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

dotenv.config();

const FORCE_FIX = async () => {
    try {
        await connectDB();
        const assessments = await SubmittedAssessment.find({});
        console.log(`Auditing ${assessments.length} assessments...`);

        let fixed = 0;
        for (const sa of assessments) {
            const role = (sa.userDetails?.role || sa.stakeholder || "employee").toLowerCase();
            let changed = false;

            if (!sa.scores || !sa.scores.domains) continue;

            for (const domainName in sa.scores.domains) {
                const domain = sa.scores.domains[domainName];

                // We always re-run feedback logic to ensure it's aligned with the current JSON
                domain.subdomainFeedback = {};
                let minScore = 101;
                let minSubName = null;

                for (const subName in domain.subdomains) {
                    const subScore = domain.subdomains[subName];
                    if (subScore < minScore) {
                        minScore = subScore;
                        minSubName = subName;
                    }
                    const fb = getSubdomainFeedback(subName, subScore, role);
                    if (fb) domain.subdomainFeedback[subName] = fb;
                }

                if (minSubName) {
                    domain.feedback = getSubdomainFeedback(minSubName, minScore, role);
                }
                changed = true;
            }

            if (changed) {
                sa.markModified('scores');
                await sa.save();
                fixed++;
            }
        }
        console.log(`Successfully synced ${fixed} assessments with the new logic.`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

FORCE_FIX();
