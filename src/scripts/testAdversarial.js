import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";
import * as controller from "../controllers/benefitsRealization.controller.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

function createMockRes() {
  return {
    statusCode: 200,
    headers: {},
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    },
    setHeader(name, val) {
      this.headers[name] = val;
      return this;
    },
    send(payload) {
      this.data = payload;
      return this;
    },
  };
}

async function runAdversarialTests() {
  console.log("==========================================================");
  console.log("🕵️ RUNNING DEEP ADVERSARIAL & EDGE-CASE TEST SUITE");
  console.log("==========================================================");

  await mongoose.connect(process.env.MONGODB_URL);
  console.log("✅ MongoDB Atlas Connected\n");

  let issuesFound = [];

  const defaultAdmin = { role: "admin", orgName: "Langara College" };

  // 1. Edge Case: Invalid checkpoint bounds (< 1, > 5, string)
  console.log("1. Testing Checkpoint validation boundary checks...");
  for (const badCp of [0, 6, -1, 999, "abc", null]) {
    const res = createMockRes();
    await controller.updateActiveCheckpoint({ user: defaultAdmin, body: { orgName: "Langara College", checkpointNumber: badCp } }, res);
    if (res.statusCode !== 400 || res.data?.success !== false) {
      issuesFound.push(`Checkpoint ${badCp} did not return HTTP 400 Bad Request`);
    }
  }
  console.log("   ✅ Checkpoint boundary checks correctly reject invalid values with HTTP 400");

  // 2. Edge Case: Invalid driverId in scorecard
  console.log("2. Testing Scorecard Driver error handling...");
  {
    const res = createMockRes();
    await controller.updateScorecardDriver({ user: defaultAdmin, body: { orgName: "Langara College", driverId: "B99", score: 4.0 } }, res);
    if (res.statusCode !== 404 || res.data?.success !== false) {
      issuesFound.push("Non-existent driverId B99 did not return HTTP 404 Not Found");
    } else {
      console.log("   ✅ Non-existent driverId B99 correctly returns HTTP 404");
    }
  }

  // 3. Edge Case: Missing required score in scorecard update
  {
    const res = createMockRes();
    await controller.updateScorecardDriver({ user: defaultAdmin, body: { orgName: "Langara College", driverId: "B1" } }, res);
    if (res.statusCode !== 400 || res.data?.success !== false) {
      issuesFound.push("Missing score in updateScorecardDriver did not return HTTP 400");
    } else {
      console.log("   ✅ Missing score correctly returns HTTP 400");
    }
  }

  // 4. Edge Case: Invalid Needs Attention ID
  console.log("3. Testing Needs Attention error handling...");
  {
    const res = createMockRes();
    await controller.updateNeedsAttention({ user: defaultAdmin, body: { orgName: "Langara College", id: "NON_EXISTENT_ID", recommendation: "test" } }, res);
    if (res.statusCode !== 404 || res.data?.success !== false) {
      issuesFound.push("Non-existent needs attention id did not return HTTP 404");
    } else {
      console.log("   ✅ Non-existent item ID correctly returns HTTP 404");
    }
  }

  // 5. Edge Case: Missing id in Needs Attention update
  {
    const res = createMockRes();
    await controller.updateNeedsAttention({ user: defaultAdmin, body: { orgName: "Langara College", recommendation: "test" } }, res);
    if (res.statusCode !== 400 || res.data?.success !== false) {
      issuesFound.push("Missing id in updateNeedsAttention did not return HTTP 400");
    } else {
      console.log("   ✅ Missing item ID correctly returns HTTP 400");
    }
  }

  // 6. Edge Case: Case-insensitivity & whitespace in org name
  console.log("4. Testing Org Name normalization and fallback...");
  {
    const res = createMockRes();
    await controller.getBenefitsRealization({ query: { orgName: "  lAnGaRa CoLlEgE  " } }, res);
    if (res.statusCode !== 200 || !res.data?.data) {
      issuesFound.push("Mixed-case padded org name failed to resolve");
    } else {
      console.log("   ✅ Mixed-case with whitespace correctly resolved:", res.data.data.orgName);
    }
  }

  // 7. Edge Case: Arbitrary unknown org name fallback
  {
    const res = createMockRes();
    await controller.getBenefitsRealization({ query: { orgName: "Unknown_Enterprise_99" } }, res);
    if (res.statusCode !== 200 || !res.data?.data) {
      issuesFound.push("Arbitrary unknown org name failed to fallback to default tenant");
    } else {
      console.log("   ✅ Fallback to primary tenant for unknown org succeeded:", res.data.data.orgName);
    }
  }

  // 8. Edge Case: Excel Export binary integrity check
  console.log("5. Testing Excel export binary validation...");
  {
    const res = createMockRes();
    await controller.exportBenefitsExcel({ query: { orgName: "Langara College" } }, res);
    const buffer = res.data;
    if (!Buffer.isBuffer(buffer) || buffer.length < 1000) {
      issuesFound.push("Excel buffer is corrupted or too small");
    } else {
      const XLSX = (await import("xlsx")).default;
      const wb = XLSX.read(buffer, { type: "buffer" });
      if (wb.SheetNames.length !== 7) {
        issuesFound.push(`Excel sheets count is ${wb.SheetNames.length}, expected 7`);
      } else {
        console.log(`   ✅ Excel export is valid binary (${buffer.length} bytes), 7 worksheets matching client workbook`);
      }
    }
  }

  await mongoose.disconnect();

  console.log("\n==========================================================");
  if (issuesFound.length > 0) {
    console.error("❌ ISSUES FOUND:");
    issuesFound.forEach((iss, i) => console.error(`   ${i + 1}. ${iss}`));
    process.exit(1);
  } else {
    console.log("🎉 ZERO ISSUES FOUND! All adversarial & boundary checks passed perfectly!");
    console.log("==========================================================");
    process.exit(0);
  }
}

runAdversarialTests().catch((err) => {
  console.error("FATAL ERROR:", err);
  process.exit(1);
});
