
import mongoose from "mongoose";
import Question from "./src/models/question.model.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env relative to current directory
dotenv.config({ path: path.join(__dirname, '.env') });

console.log("Connecting to DB:", process.env.MONGODB_URI ? "URI Found" : "URI NOT Found");

const run = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            console.error("No MONGODB_URI in .env file!");
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB");

        const questions = await Question.find({});
        console.log(`Total Questions found: ${questions.length}`);

        const stakeholderCounts = {};
        questions.forEach(q => {
            const hasStakeholder = q.stakeholder;
            const isDel = q.isDeleted;
            const key = `${hasStakeholder} (deleted=${isDel})`;
            stakeholderCounts[key] = (stakeholderCounts[key] || 0) + 1;
        });

        console.log("Questions Breakdown:", stakeholderCounts);

        if (questions.length > 0) {
            console.log("Sample question stakeholder:", questions[0].stakeholder);
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected");
    }
};

run();
