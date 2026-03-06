import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "./src/db/index.js";
import SubmittedAssessment from "./src/models/submittedAssessment.model.js";
import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

dotenv.config();

const inspect = async () => {
    try {
        await connectDB();

        const sa = await SubmittedAssessment.findOne({
            $or: [
                { "userDetails.role": "manager" },
                { "stakeholder": "manager" }
            ]
        }).sort({ submittedAt: -1 }).lean();

        if (sa && sa.scores?.domains?.["People Potential"]) {
            console.log("STRUCTURE FOR 'People Potential' (MANAGER):");
            console.log(JSON.stringify(sa.scores.domains["People Potential"], null, 2));
        } else {
            console.log("No manager assessment found to inspect.");
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

inspect();
