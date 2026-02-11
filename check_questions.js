
import mongoose from "mongoose";
import Question from "./src/models/question.model.js";
import dotenv from "dotenv";

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB");

        const stakeholders = await Question.distinct("stakeholder");
        console.log("Distinct Stakeholders in Questions:", stakeholders);

        const counts = await Promise.all(stakeholders.map(async (s) => {
            const count = await Question.countDocuments({ stakeholder: s, isDeleted: false });
            return { stakeholder: s, count };
        }));

        console.log("Active Question Counts:", counts);

        // Check for capitalized versions just in case
        const allQuestions = await Question.find({}).limit(5);
        if (allQuestions.length > 0) {
            console.log("Sample question stakeholder:", allQuestions[0].stakeholder);
        } else {
            console.log("No questions found.");
        }

    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
};

run();
