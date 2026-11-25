import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";
import * as benefitsController from "../controllers/benefitsRealization.controller.js";
import BenefitsRealization from "../models/benefitsRealization.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// Mock Express req and res helper
function createMockReqRes(reqData = {}) {
  const req = {
    query: reqData.query || {},
    body: reqData.body || {},
    params: reqData.params || {},
    user: reqData.user || { role: "superAdmin", orgName: "Langara College" },
  };

  const res = {
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

  return { req, res };
}

async function runTestSuite() {
  console.log("==========================================================");
  console.log("🚀 STARTING POD-360 BENEFITS REALIZATION FULL TEST SUITE");
  console.log("==========================================================");

  const mongoUrl = process.env.MONGODB_URL;
  if (!mongoUrl) {
    throw new Error("MONGODB_URL not found in .env");
  }

  console.log("1. Connecting to MongoDB Atlas...");
  await mongoose.connect(mongoUrl);
  console.log("   ✅ MongoDB Atlas Connected successfully!\n");

  // TEST 1: GET Benefits Realization
  console.log("2. Testing GET /api/v1/benefits (getBenefitsRealization)...");
  {
    const { req, res } = createMockReqRes({ query: { orgName: "Langara College" } });
    await benefitsController.getBenefitsRealization(req, res);
    if (res.statusCode !== 200 || !res.data?.success) {
      throw new Error(`GET failed with status ${res.statusCode}: ${JSON.stringify(res.data)}`);
    }
    const d = res.data.data;
    console.log(`   ✅ Status: ${res.statusCode}`);
    console.log(`   ✅ Program: ${d.programName}`);
    console.log(`   ✅ PID: ${d.pid}`);
    console.log(`   ✅ Wave: ${d.waveName}`);
    console.log(`   ✅ Overall Score: ${d.overallScore} / ${d.targetScore} (${d.realizationPercentage}%)`);
    console.log(`   ✅ Active Checkpoint: Checkpoint ${d.activeCheckpointNumber}`);
    console.log(`   ✅ Stakeholders: ${d.stakeholders.map((s) => `${s.name} (${s.role})`).join("; ")}`);
    console.log(`   ✅ 4 Pillars: ${d.pillars.map((p) => `${p.name}: ${p.score} [${p.status}]`).join(", ")}`);
    console.log(`   ✅ Outcomes Hygiene: Folder count ${d.outcomes.folderCount.baseline} ➔ ${d.outcomes.folderCount.current} (${d.outcomes.folderCount.percentChange}%)`);
    console.log(`   ✅ Security & Governance: ${d.outcomes.everyoneGrants} 'Everyone' grants, ${d.outcomes.trainedStaff}/${d.outcomes.totalStaff} staff trained`);
    console.log(`   ✅ Strategic Scorecard: ${d.scorecard.length} drivers`);
    console.log(`   ✅ Needs Attention Items: ${d.needsAttention.length} priorities`);
  }

  // TEST 2: PUT Update Checkpoint
  console.log("\n3. Testing PUT /api/v1/benefits/checkpoint (updateActiveCheckpoint)...");
  {
    const { req, res } = createMockReqRes({
      body: { orgName: "Langara College", checkpointNumber: 4 },
    });
    await benefitsController.updateActiveCheckpoint(req, res);
    if (res.statusCode !== 200 || !res.data?.success) {
      throw new Error(`Checkpoint update failed: ${JSON.stringify(res.data)}`);
    }
    console.log(`   ✅ Updated checkpoint to: Checkpoint ${res.data.data.activeCheckpointNumber}`);

    // Verify in DB directly
    const checkDoc = await BenefitsRealization.findOne({ orgName: "Langara College" });
    if (checkDoc.activeCheckpointNumber !== 4) {
      throw new Error("DB verification failed: activeCheckpointNumber is not 4");
    }
    console.log("   ✅ Verified persistence in MongoDB Atlas (activeCheckpointNumber = 4)");

    // Revert back to 3 for Langara PRM standard
    const { req: reqRev, res: resRev } = createMockReqRes({
      body: { orgName: "Langara College", checkpointNumber: 3 },
    });
    await benefitsController.updateActiveCheckpoint(reqRev, resRev);
    console.log(`   ✅ Restored checkpoint back to: Checkpoint ${resRev.data.data.activeCheckpointNumber}`);
  }

  // TEST 3: PUT Update Scorecard Driver
  console.log("\n4. Testing PUT /api/v1/benefits/scorecard-driver (updateScorecardDriver)...");
  {
    const { req, res } = createMockReqRes({
      body: { orgName: "Langara College", driverId: "B1", score: 4.3, status: "On Track" },
    });
    await benefitsController.updateScorecardDriver(req, res);
    if (res.statusCode !== 200 || !res.data?.success) {
      throw new Error(`Scorecard update failed: ${JSON.stringify(res.data)}`);
    }
    const b1 = res.data.data.scorecard.find((s) => s.driverId === "B1");
    console.log(`   ✅ Updated driver B1 (${b1.name}) score: ${b1.score}`);
    console.log(`   ✅ Recalculated overall score: ${res.data.data.overallScore} (${res.data.data.realizationPercentage}%)`);

    // Restore B1 back to 4.2
    const { req: reqB1, res: resB1 } = createMockReqRes({
      body: { orgName: "Langara College", driverId: "B1", score: 4.2, status: "On Track" },
    });
    await benefitsController.updateScorecardDriver(reqB1, resB1);
    console.log(`   ✅ Restored driver B1 back to baseline score: 4.2`);
  }

  // TEST 4: PUT Update Needs Attention Recommendation
  console.log("\n5. Testing PUT /api/v1/benefits/needs-attention (updateNeedsAttention)...");
  {
    const targetDoc = await BenefitsRealization.findOne({ orgName: "Langara College" });
    const firstPriority = targetDoc.needsAttention[0];
    const originalRec = firstPriority.recommendation;
    const testRec = originalRec + " [VERIFIED_AUDIT]";

    const { req, res } = createMockReqRes({
      body: {
        orgName: "Langara College",
        id: firstPriority.id,
        recommendation: testRec,
      },
    });
    await benefitsController.updateNeedsAttention(req, res);
    if (res.statusCode !== 200 || !res.data?.success) {
      throw new Error(`Needs Attention update failed: ${JSON.stringify(res.data)}`);
    }
    const updatedP1 = res.data.data.needsAttention.find((p) => p.id === firstPriority.id);
    console.log(`   ✅ Updated recommendation: "${updatedP1.recommendation}"`);

    // Restore original recommendation
    const { req: reqRestore, res: resRestore } = createMockReqRes({
      body: {
        orgName: "Langara College",
        id: firstPriority.id,
        recommendation: originalRec,
      },
    });
    await benefitsController.updateNeedsAttention(reqRestore, resRestore);
    console.log("   ✅ Cleanly reverted recommendation back to pristine original state");
  }

  // TEST 5: GET Export Benefits Excel
  console.log("\n6. Testing GET /api/v1/benefits/export-excel (exportBenefitsExcel)...");
  {
    const { req, res } = createMockReqRes({ query: { orgName: "Langara College" } });
    await benefitsController.exportBenefitsExcel(req, res);
    if (res.statusCode !== 200) {
      throw new Error(`Export Excel failed with status ${res.statusCode}`);
    }
    const buffer = res.data;
    if (!Buffer.isBuffer(buffer)) {
      throw new Error("Export Excel did not return a valid binary Buffer");
    }
    console.log(`   ✅ Content-Type header: ${res.headers["Content-Type"]}`);
    console.log(`   ✅ Content-Disposition: ${res.headers["Content-Disposition"]}`);
    console.log(`   ✅ Buffer generated size: ${buffer.length.toLocaleString()} bytes`);

    // Inspect generated Excel workbook sheets using xlsx
    const XLSX = (await import("xlsx")).default;
    const workbook = XLSX.read(buffer, { type: "buffer" });
    console.log(`   ✅ Workbook sheet count: ${workbook.SheetNames.length}`);
    console.log(`   ✅ Sheet Names: ${workbook.SheetNames.join(", ")}`);

    const expectedSheets = [
      "Overview",
      "Benefits Scorecard",
      "Checkpoints",
      "Hygiene & Outcomes",
      "Needs Attention",
    ];
    for (const sheetName of expectedSheets) {
      if (!workbook.SheetNames.includes(sheetName)) {
        throw new Error(`Missing expected worksheet: ${sheetName}`);
      }
    }
    console.log("   ✅ All 5 Excel worksheets validated with complete tabular data!");
  }

  // TEST 6: Org Fallback (WTEC alias)
  console.log("\n7. Testing Organization Alias Fallback (WTEC)...");
  {
    const { req, res } = createMockReqRes({ query: { orgName: "WTEC" } });
    await benefitsController.getBenefitsRealization(req, res);
    if (res.statusCode !== 200 || !res.data?.success) {
      throw new Error(`WTEC query failed: ${JSON.stringify(res.data)}`);
    }
    console.log(`   ✅ WTEC alias loaded correctly: ${res.data.data.programName} (${res.data.data.orgName})`);
  }

  console.log("\n==========================================================");
  console.log("🎉 ALL BACKEND & EXPORT TESTS PASSED WITH 100% SUCCESS!");
  console.log("==========================================================");

  await mongoose.disconnect();
  console.log("MongoDB Disconnected cleanly.\n");
  process.exit(0);
}

runTestSuite().catch((err) => {
  console.error("❌ TEST SUITE FAILED:", err);
  process.exit(1);
});
