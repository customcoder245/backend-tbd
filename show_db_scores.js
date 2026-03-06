import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "./src/db/index.js";
import SubmittedAssessment from "./src/models/submittedAssessment.model.js";
import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

dotenv.config();

const showData = async () => {
    try {
        await connectDB();

        const roles = ["admin", "leader", "manager", "employee"];

        for (const role of roles) {
            console.log(`\n--- LATEST ${role.toUpperCase()} ASSESSMENT DATA ---`);
            const sa = await SubmittedAssessment.findOne({
                $or: [
                    { "userDetails.role": role },
                    { "stakeholder": role }
                ]
            }).sort({ submittedAt: -1 }).lean();

            if (sa) {
                console.log(JSON.stringify({
                    role: sa.userDetails?.role || sa.stakeholder,
                    overall: sa.scores?.overall,
                    domains: Object.keys(sa.scores?.domains || {}).map(d => ({
                        name: d,
                        score: sa.scores.domains[d].score,
                        hasFeedback: !!sa.scores.domains[d].feedback,
                        subdomains: sa.scores.domains[d].subdomains
                    }))
                }, null, 2));
            } else {
                console.log(`No assessments found for role: ${role}`);
            }
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

showData();
