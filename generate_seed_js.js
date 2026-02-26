
import fs from 'fs';

const questions = JSON.parse(fs.readFileSync('final_questions.json', 'utf8'));

const content = `import mongoose from "mongoose";
import dotenv from "dotenv";
import Question from "../models/question.model.js";

dotenv.config();

const questions = ${JSON.stringify(questions, null, 2)};

const seedQuestions = async () => {
  try {
    console.log("Connecting to database...");
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("Connected.");

    console.log(\`Starting to seed/update \${questions.length} questions...\`);
    
    let count = 0;
    for (const qData of questions) {
        const existing = await Question.findOne({ questionCode: qData.questionCode });
        if (existing) {
            await Question.findByIdAndUpdate(existing._id, qData);
        } else {
            await Question.create(qData);
        }
        count++;
        if (count % 20 === 0) console.log(\`Processed \${count}...\`);
    }

    console.log(\`Successfully completed. Total: \${count} questions.\`);
    process.exit(0);
  } catch (error) {
    console.error("Error seeding:", error);
    process.exit(1);
  }
};

seedQuestions();
`;

fs.writeFileSync('src/scripts/seedQuestion.js', content);
console.log("seedQuestion.js updated successfully.");
