import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "dns";
import path from "path";
import { fileURLToPath } from "url";
import ExcelJS from "exceljs";
import JSZip from "jszip";
import {
  exportBenefitsExcel,
  exportBenefitsPptx
} from "../controllers/benefitsRealization.controller.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dns.setServers(["8.8.8.8", "1.1.1.1"]);

function createMockRes() {
  const headers = {};
  let statusCode = 200;
  let sentBuffer = null;
  return {
    setHeader(k, v) {
      headers[k] = v;
    },
    status(c) {
      statusCode = c;
      return this;
    },
    json(obj) {
      sentBuffer = obj;
      return this;
    },
    send(buf) {
      sentBuffer = buf;
      return this;
    },
    getResult() {
      return { statusCode, headers, sentBuffer };
    }
  };
}

async function runFullControllerTests() {
  await mongoose.connect(process.env.MONGODB_URL);
  console.log("1. Connected to live MongoDB Atlas");

  // Test 1: exportBenefitsExcel
  const reqExcel = { query: { orgName: "Langara College" }, user: { role: "superAdmin" } };
  const resExcel = createMockRes();
  await exportBenefitsExcel(reqExcel, resExcel);
  const excelOut = resExcel.getResult();

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(excelOut.sentBuffer);
  console.log(
    `2. Excel Export Status: ${excelOut.statusCode} | Bytes: ${excelOut.sentBuffer.length} | Total Sheets: ${wb.worksheets.length}`
  );
  wb.eachSheet((ws, id) => {
    console.log(`   - Sheet ${id}: "${ws.name}" (${ws.rowCount} rows)`);
  });

  // Verify Sheet 9 (Benefits Map & Alignment) contents
  const ws9 = wb.getWorksheet("Benefits Map & Alignment");
  console.log(`   - Sheet 9 Priority Roll-ups:`);
  for (let r = 6; r <= 8; r++) {
    const row = ws9.getRow(r);
    console.log(
      `     * ${row.getCell(1).value}: ${row.getCell(2).value} | ${row.getCell(3).value} | Avg: ${row.getCell(4).value} (${row.getCell(5).value})`
    );
  }

  // Verify Sheet 3 (Stage-Gate Checkpoints)
  const ws3 = wb.getWorksheet("Stage-Gate Checkpoints");
  console.log(`   - Sheet 3 Checkpoints:`);
  for (let r = 5; r <= 9; r++) {
    const row = ws3.getRow(r);
    console.log(
      `     * ${row.getCell(1).value}: ${row.getCell(2).value} | Score: ${row.getCell(4).value} | Status: ${row.getCell(5).value}`
    );
  }

  // Test 2: exportBenefitsPptx (11-slide PRM Executive Deck)
  const reqPrm = {
    query: { orgName: "Langara College", type: "prm" },
    user: { role: "superAdmin" }
  };
  const resPrm = createMockRes();
  await exportBenefitsPptx(reqPrm, resPrm);
  const prmOut = resPrm.getResult();
  const prmZip = await JSZip.loadAsync(prmOut.sentBuffer);
  const prmSlides = Object.keys(prmZip.files).filter(
    (k) => k.startsWith("ppt/slides/slide") && k.endsWith(".xml")
  );
  console.log(
    `3. PRM 11-Slide PPTX Export Status: ${prmOut.statusCode} | Bytes: ${prmOut.sentBuffer.length} | Slides: ${prmSlides.length}`
  );

  // Test 3: exportBenefitsPptx (2-slide Program Roll-Up Deck)
  const reqProg = {
    query: { orgName: "Langara College", type: "program" },
    user: { role: "superAdmin" }
  };
  const resProg = createMockRes();
  await exportBenefitsPptx(reqProg, resProg);
  const progOut = resProg.getResult();
  const progZip = await JSZip.loadAsync(progOut.sentBuffer);
  const progSlides = Object.keys(progZip.files).filter(
    (k) => k.startsWith("ppt/slides/slide") && k.endsWith(".xml")
  );
  console.log(
    `4. Program 2-Slide PPTX Export Status: ${progOut.statusCode} | Bytes: ${progOut.sentBuffer.length} | Slides: ${progSlides.length}`
  );

  process.exit(0);
}

runFullControllerTests().catch((err) => {
  console.error("TEST FAILED:", err);
  process.exit(1);
});
