import XLSX from "xlsx";
import path from "path";

const filePath =
  "C:/Users/Hello/.gemini/antigravity/brain/5db30fda-c1fb-4dff-b094-a397d9f55aeb/.user_uploaded/media_1794981893893_9bf51a96.xlsx";
const wb = XLSX.readFile(filePath);

console.log("SHEET NAMES:", wb.SheetNames);

for (const sheetName of wb.SheetNames) {
  console.log(`\n=================== SHEET: ${sheetName} ===================`);
  const sheet = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  rows.forEach((row, idx) => {
    if (row && row.some((cell) => cell !== undefined && cell !== "")) {
      const cleanRow = row.map((c) =>
        typeof c === "number"
          ? Math.round(c * 100) / 100
          : String(c || "")
              .trim()
              .replace(/\r?\n/g, " ")
      );
      console.log(`[R${idx}] ${cleanRow.slice(0, 8).join("  |  ")}`);
    }
  });
}
