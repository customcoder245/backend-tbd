import xlsx from 'xlsx';
import fs from 'fs';

const filePath = 'c:\\Users\\ST\\OneDrive\\Desktop\\POD360_Refined_Questions - Version 2 - Complete.xlsx';

try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const datasheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(datasheet);

    fs.writeFileSync('questions_v2.json', JSON.stringify(data, null, 2));
    console.log('Successfully extracted data to questions_v2.json');
    console.log('Sample data:', JSON.stringify(data.slice(0, 2), null, 2));
} catch (error) {
    console.error('Error reading xlsx:', error);
}
