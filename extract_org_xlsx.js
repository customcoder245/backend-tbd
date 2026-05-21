import xlsx from 'xlsx';
import fs from 'fs';

const filePath = 'C:/Users/ST/OneDrive/Desktop/POD360_Org_Health_Dashboard_Outputs_v3.xlsx';

try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const datasheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(datasheet);

    fs.writeFileSync('org_feedback.json', JSON.stringify(data, null, 2));
    console.log('Successfully extracted data to org_feedback.json');
} catch (error) {
    console.error('Error reading xlsx:', error);
}
