import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "./src/db/index.js";
import SubmittedAssessment from "./src/models/submittedAssessment.model.js";
import Assessment from "./src/models/assessment.model.js";
import { getSubdomainFeedback } from "./src/utils/feedback.utils.js";
import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);


dotenv.config();

const fixOldAssessments = async () => {
    try {
        await connectDB();

        console.log("Looking for submitted assessments missing subdomainFeedback...");
        const assessments = await SubmittedAssessment.find({});

        let fixedCount = 0;

        for (const sa of assessments) {
            let needsUpdate = false;
            if (!sa.scores || !sa.scores.domains) continue;

            const role = sa.userDetails?.role || sa.stakeholder || "employee";

            for (const domainName in sa.scores.domains) {
                const domainObj = sa.scores.domains[domainName];

                // If it's missing subdomainFeedback OR feedback is missing/null
                if (!domainObj.subdomainFeedback || Object.keys(domainObj.subdomainFeedback).length === 0 || !domainObj.feedback) {
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
                            domainObj.subdomainFeedback[subName] = subFb;
                        }
                    }

                    if (minSubName) {
                        domainObj.feedback = getSubdomainFeedback(minSubName, minScore, role);
                    }

                    needsUpdate = true;
                }
            }

            if (needsUpdate) {
                sa.markModified('scores');
                await sa.save();

                // Also update the original Assessment object if possible
                const originalAss = await Assessment.findById(sa.assessmentId);
                if (originalAss) {
                    originalAss.scores = sa.scores;
                    originalAss.markModified('scores');
                    await originalAss.save();
                }

                fixedCount++;
            }
        }

        console.log(`Successfully fixed ${fixedCount} assessments!`);
        process.exit(0);
    } catch (err) {
        console.error("Error fixing assessments:", err);
        process.exit(1);
    }
};

fixOldAssessments();
