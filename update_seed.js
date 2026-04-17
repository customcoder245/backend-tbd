import fs from 'fs';

const newQuestionsArray = fs.readFileSync('new_questions_array.txt', 'utf8');
const originalFile = fs.readFileSync('src/scripts/seedQuestion.js', 'utf8');

const fileParts = originalFile.split('\n');
const topPart = fileParts.slice(0, 8).join('\n'); // Lines 1-8
const bottomPart = fileParts.slice(3190).join('\n'); // Line 3192 onwards (0-indexed 3191)
// Wait, original file had 3218 lines.
// Line 9 is index 8. Line 3190 is index 3189.
// Slice(0,8) gets lines 1-8.
// Slice(3190) gets line 3191 onwards.

const finalContent = `${topPart}\n\n${newQuestionsArray}\n${bottomPart}`;

fs.writeFileSync('src/scripts/seedQuestion.js', finalContent);
console.log('Successfully updated src/scripts/seedQuestion.js');
