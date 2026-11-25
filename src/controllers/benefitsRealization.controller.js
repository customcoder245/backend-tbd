import BenefitsRealization from "../models/benefitsRealization.model.js";
import ExcelJS from "exceljs";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Resilient document finder with automatic alias & fallback resolution
 */
const findBenefitsDoc = async (orgTarget, lean = false) => {
  const cleanTarget = (orgTarget || "").trim();
  let query = BenefitsRealization.findOne({
    orgName: { $regex: new RegExp(`^${cleanTarget}$`, "i") }
  });
  if (lean) query = query.lean();
  let record = await query;

  if (!record) {
    let fallbackQuery = BenefitsRealization.findOne({
      orgName: { $in: ["Langara College", "WTEC"] }
    });
    if (lean) fallbackQuery = fallbackQuery.lean();
    record = await fallbackQuery;
  }
  return record;
};

/**
 * @desc    Get Benefits Realization data for an organization
 * @route   GET /api/v1/benefits
 * @access  Private
 */
export const getBenefitsRealization = async (req, res) => {
  try {
    const orgQuery = req.query.orgName || req.user?.orgName || "Langara College";
    const data = await findBenefitsDoc(orgQuery, true);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: `No Benefits Realization record found for organization '${orgQuery}'`
      });
    }

    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error("[BENEFITS GET ERROR]", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch Benefits Realization data",
      error: error.message
    });
  }
};

/**
 * @desc    Update active review gate / checkpoint
 * @route   PUT /api/v1/benefits/checkpoint
 * @access  Private (Admin / SuperAdmin)
 */
export const updateActiveCheckpoint = async (req, res) => {
  try {
    const { orgName, checkpointNumber } = req.body;
    const targetCheckpoint = Number(checkpointNumber);

    if (!targetCheckpoint || targetCheckpoint < 1 || targetCheckpoint > 5) {
      return res.status(400).json({
        success: false,
        message: "Invalid checkpointNumber. Must be between 1 and 5."
      });
    }

    const orgTarget = orgName || req.user?.orgName || "Langara College";
    const record = await findBenefitsDoc(orgTarget, false);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: `Benefits Realization record for '${orgTarget}' not found.`
      });
    }

    record.activeCheckpointNumber = targetCheckpoint;

    // Update statuses across checkpoints
    record.checkpoints = record.checkpoints.map((cp) => {
      const num = Number(cp.checkpointNumber);
      if (num < targetCheckpoint) {
        cp.status = "COMPLETED";
      } else if (num === targetCheckpoint) {
        cp.status = "ACTIVE";
      } else {
        cp.status = "UPCOMING";
      }
      return cp;
    });

    await record.save();

    return res.status(200).json({
      success: true,
      message: `Active checkpoint updated to Checkpoint ${targetCheckpoint}`,
      data: record
    });
  } catch (error) {
    console.error("[BENEFITS CHECKPOINT UPDATE ERROR]", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update checkpoint",
      error: error.message
    });
  }
};

/**
 * @desc    Update individual scorecard driver (B1 - B9)
 * @route   PUT /api/v1/benefits/scorecard
 * @access  Private (Admin / SuperAdmin)
 */
export const updateScorecardDriver = async (req, res) => {
  try {
    const { orgName, driverId, score, status, evidence } = req.body;

    if (!driverId || score === undefined) {
      return res.status(400).json({
        success: false,
        message: "driverId and score are required."
      });
    }

    const orgTarget = orgName || req.user?.orgName || "Langara College";
    const record = await findBenefitsDoc(orgTarget, false);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: `Benefits Realization record for '${orgTarget}' not found.`
      });
    }

    const driverIndex = record.scorecard.findIndex(
      (d) => d.driverId.toUpperCase() === driverId.toUpperCase()
    );

    if (driverIndex === -1) {
      return res.status(404).json({
        success: false,
        message: `Driver ID '${driverId}' not found in scorecard.`
      });
    }

    record.scorecard[driverIndex].score = Number(score);
    if (status) record.scorecard[driverIndex].status = status;
    if (evidence !== undefined) record.scorecard[driverIndex].evidence = evidence;

    // Recalculate overall score based on B1-B9 average
    const totalScore = record.scorecard.reduce((sum, d) => sum + (Number(d.score) || 0), 0);
    const meanScore = Number((totalScore / record.scorecard.length).toFixed(1));
    record.overallScore = meanScore;
    record.realizationPercentage = Math.round((meanScore / (record.targetScore || 5.0)) * 100);

    await record.save();

    return res.status(200).json({
      success: true,
      message: `Scorecard driver ${driverId} updated successfully`,
      data: record
    });
  } catch (error) {
    console.error("[BENEFITS SCORECARD UPDATE ERROR]", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update scorecard driver",
      error: error.message
    });
  }
};

/**
 * @desc    Update needs attention recommendations or action items
 * @route   PUT /api/v1/benefits/needs-attention
 * @access  Private (Admin / SuperAdmin)
 */
export const updateNeedsAttention = async (req, res) => {
  try {
    const { orgName, id, recommendation, severity, healthStatus } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "id is required."
      });
    }

    const orgTarget = orgName || req.user?.orgName || "Langara College";
    const record = await findBenefitsDoc(orgTarget, false);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: `Benefits Realization record for '${orgTarget}' not found.`
      });
    }

    const item = record.needsAttention.find((na) => na.id === id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: `Needs attention item '${id}' not found.`
      });
    }

    if (recommendation !== undefined) item.recommendation = recommendation;
    if (severity !== undefined) item.severity = severity;
    if (healthStatus !== undefined) item.healthStatus = healthStatus;

    await record.save();

    return res.status(200).json({
      success: true,
      message: `Needs attention item ${id} updated`,
      data: record
    });
  } catch (error) {
    console.error("[BENEFITS NEEDS ATTENTION UPDATE ERROR]", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update needs attention",
      error: error.message
    });
  }
};

/**
 * Helper: Apply uniform thin border to a cell
 */
const applyCellBorder = (cell, color = "E2E8F0") => {
  cell.border = {
    top: { style: "thin", color: { argb: color } },
    left: { style: "thin", color: { argb: color } },
    bottom: { style: "thin", color: { argb: color } },
    right: { style: "thin", color: { argb: color } }
  };
};

/**
 * Helper: Format status badge cell
 */
const styleStatusCell = (cell, status) => {
  const norm = (status || "").toString().trim().toUpperCase();
  let bg = "F1F5F9";
  let fg = "475569";

  if (norm.includes("TRACK") || norm.includes("COMPLETED") || norm.includes("VERIFIED") || norm.includes("ENFORCED") || norm.includes("ADOPTION")) {
    bg = "E8F8EE";
    fg = "1E824C";
  } else if (norm.includes("PROGRESS") || norm.includes("ACTIVE")) {
    bg = "EBF5FB";
    fg = "1D4ED8";
  } else if (norm.includes("MONITOR") || norm.includes("MEDIUM")) {
    bg = "FFF9E6";
    fg = "B45309";
  } else if (norm.includes("CRITICAL") || norm.includes("RISK") || norm.includes("HIGH") || norm.includes("WEAK")) {
    bg = "FEE2E2";
    fg = "B91C1C";
  } else if (norm.includes("UPCOMING")) {
    bg = "F8FAFC";
    fg = "64748B";
  }

  cell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: bg }
  };
  cell.font = {
    name: "Segoe UI",
    size: 10,
    bold: true,
    color: { argb: fg }
  };
  cell.alignment = { horizontal: "center", vertical: "middle" };
  applyCellBorder(cell, "CBD5E1");
};

/**
 * @desc    Export Benefits Realization data as visually stunning Excel workbook (.xlsx)
 * @route   GET /api/v1/benefits/export-excel
 * @access  Private (flexibleProtect)
 */
export const exportBenefitsExcel = async (req, res) => {
  try {
    const orgQuery = req.query.orgName || req.user?.orgName || "Langara College";
    const data = await findBenefitsDoc(orgQuery, true);

    if (!data) {
      return res.status(404).json({ message: "Benefits record not found" });
    }

    const wb = new ExcelJS.Workbook();
    wb.creator = "POD-360 Platform";
    wb.lastModifiedBy = "Langara College LCP Team";
    wb.created = new Date();
    wb.modified = new Date();

    // =========================================================================
    // SHEET 1: EXECUTIVE DASHBOARD
    // =========================================================================
    const ws1 = wb.addWorksheet("Executive Dashboard", {
      views: [{ showGridLines: true, state: "frozen", ySplit: 5 }]
    });

    // Title Banner
    ws1.mergeCells("A2:G2");
    const titleCell = ws1.getCell("A2");
    titleCell.value = "LANGARA COLLABORATION PLATFORM (LCP) | PID 6738";
    titleCell.font = { name: "Segoe UI", size: 15, bold: true, color: { argb: "FFFFFF" } };
    titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "E65100" } };
    titleCell.alignment = { horizontal: "left", vertical: "middle", indent: 1 };
    ws1.getRow(2).height = 36;

    // Subtitle Banner
    ws1.mergeCells("A3:G3");
    const subCell = ws1.getCell("A3");
    subCell.value = "Admin Group 1 — Privacy & Records Management (PRM) • 90-Day Post-Go-Live Review Gate";
    subCell.font = { name: "Segoe UI", size: 11, bold: true, color: { argb: "FFFFFF" } };
    subCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "F57C00" } };
    subCell.alignment = { horizontal: "left", vertical: "middle", indent: 1 };
    ws1.getRow(3).height = 24;

    // Metadata Bar
    ws1.mergeCells("A4:G4");
    const metaCell = ws1.getCell("A4");
    metaCell.value = `Organization: ${data.orgName}   |   Business Unit: PRM   |   Go-Live: June 2, 2026   |   Active Gate: Checkpoint ${data.activeCheckpointNumber}   |   Export Date: ${new Date().toLocaleDateString("en-CA")}`;
    metaCell.font = { name: "Segoe UI", size: 9.5, italic: true, color: { argb: "334155" } };
    metaCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF7ED" } };
    metaCell.alignment = { horizontal: "left", vertical: "middle", indent: 1 };
    ws1.getRow(4).height = 20;

    // Section 1: KPI Summary Cards
    ws1.mergeCells("A6:G6");
    const kpiHeader = ws1.getCell("A6");
    kpiHeader.value = "1. EXECUTIVE KPI SUMMARY & REALIZATION INDEX";
    kpiHeader.font = { name: "Segoe UI", size: 11, bold: true, color: { argb: "FFFFFF" } };
    kpiHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "0F172A" } };
    kpiHeader.alignment = { vertical: "middle", indent: 1 };
    ws1.getRow(6).height = 26;

    const kpiRows = [
      ["Overall Program Score", `${data.overallScore} / ${data.targetScore || 5.0}`, "Realization Index", `${data.realizationPercentage || 78}%`, "Status", "Progressing (On Track for Closure)"],
      ["Active Review Stage", `Checkpoint ${data.activeCheckpointNumber} (90-Day Review)`, "Target Review Date", "November 2026", "Governance", "Steering Committee Active"],
      ["Folder Count Reduction", `${data.outcomes?.folderCount?.baseline || 541} ➔ ${data.outcomes?.folderCount?.current || 44}`, "Reduction Rate", `${data.outcomes?.folderCount?.percentChange || -91.9}%`, "Structure", "Flatter Depth (8 ➔ 2)"],
      ["Duplicate File Hygiene", `${data.outcomes?.duplicateFiles?.baseline || 117} ➔ ${data.outcomes?.duplicateFiles?.current || 49}`, "Reduction Rate", `${data.outcomes?.duplicateFiles?.percentChange || -58.1}%`, "Hygiene", "Less Redundancy"],
      ["Generic Filenames", `${data.outcomes?.genericNames?.baseline || 347} ➔ ${data.outcomes?.genericNames?.current || 41}`, "Reduction Rate", `${data.outcomes?.genericNames?.percentChange || -88.2}%`, "Findability", "Standardized Metadata"],
      ["Access Control Grants", "0 'Everyone' grants", "Folder Exceptions", "0 Exceptions", "Compliance", "BC FIPPA Baseline Enforced"],
      ["Staff Training Adoption", `${data.outcomes?.trainedStaff || 10} / ${data.outcomes?.totalStaff || 10}`, "Adoption Rate", "100%", "Enablement", "All Site Owners Trained"]
    ];

    kpiRows.forEach((r, idx) => {
      const rowNum = 7 + idx;
      const row = ws1.getRow(rowNum);
      row.values = [r[0], r[1], r[2], r[3], r[4], r[5]];
      row.height = 21;
      row.font = { name: "Segoe UI", size: 10 };

      // Style label cells
      [1, 3, 5].forEach((cIdx) => {
        const c = row.getCell(cIdx);
        c.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: "475569" } };
        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "F8FAFC" } };
        applyCellBorder(c);
      });
      // Style value cells
      [2, 4, 6].forEach((cIdx) => {
        const c = row.getCell(cIdx);
        c.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "0F172A" } };
        if (cIdx === 2 && rowNum === 7) {
          c.font = { name: "Segoe UI", size: 12, bold: true, color: { argb: "E65100" } };
        }
        applyCellBorder(c);
      });
    });

    // Section 2: Strategic Pillars
    const pillarStartRow = 16;
    ws1.mergeCells(`A${pillarStartRow}:G${pillarStartRow}`);
    const pillarHeader = ws1.getCell(`A${pillarStartRow}`);
    pillarHeader.value = "2. STRATEGIC PILLARS REALIZATION STATUS";
    pillarHeader.font = { name: "Segoe UI", size: 11, bold: true, color: { argb: "FFFFFF" } };
    pillarHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "0F172A" } };
    pillarHeader.alignment = { vertical: "middle", indent: 1 };
    ws1.getRow(pillarStartRow).height = 26;

    // Pillar Table Header
    const pThRow = ws1.getRow(pillarStartRow + 1);
    pThRow.values = ["Pillar Dimension", "Health Status", "Target", "Score", "Performance Summary", "", ""];
    ws1.mergeCells(`E${pillarStartRow + 1}:G${pillarStartRow + 1}`);
    pThRow.height = 22;
    pThRow.eachCell((c) => {
      c.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFFFFF" } };
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "334155" } };
      c.alignment = { horizontal: "center", vertical: "middle" };
      applyCellBorder(c, "1E293B");
    });

    (data.pillars || []).forEach((p, idx) => {
      const rNum = pillarStartRow + 2 + idx;
      const row = ws1.getRow(rNum);
      row.values = [p.name, p.status, 5.0, p.score, p.summary, "", ""];
      ws1.mergeCells(`E${rNum}:G${rNum}`);
      row.height = 22;

      const cName = row.getCell(1);
      cName.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "0F172A" } };
      applyCellBorder(cName);

      const cStatus = row.getCell(2);
      styleStatusCell(cStatus, p.status);

      const cTgt = row.getCell(3);
      cTgt.alignment = { horizontal: "center", vertical: "middle" };
      cTgt.font = { name: "Segoe UI", size: 10, color: { argb: "64748B" } };
      applyCellBorder(cTgt);

      const cScore = row.getCell(4);
      cScore.alignment = { horizontal: "center", vertical: "middle" };
      cScore.font = { name: "Segoe UI", size: 10.5, bold: true, color: { argb: "E65100" } };
      applyCellBorder(cScore);

      const cSumm = row.getCell(5);
      cSumm.font = { name: "Segoe UI", size: 9.5, color: { argb: "334155" } };
      cSumm.alignment = { vertical: "middle" };
      applyCellBorder(cSumm);
      applyCellBorder(row.getCell(6));
      applyCellBorder(row.getCell(7));
    });

    // Strategic Alignment Statement Callout
    const stmtRow = pillarStartRow + 7;
    ws1.mergeCells(`A${stmtRow}:G${stmtRow}`);
    const stmtHeader = ws1.getCell(`A${stmtRow}`);
    stmtHeader.value = "STRATEGIC ALIGNMENT MANDATE";
    stmtHeader.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: "E65100" } };
    stmtHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF7ED" } };
    stmtHeader.alignment = { indent: 1 };
    ws1.getRow(stmtRow).height = 20;

    ws1.mergeCells(`A${stmtRow + 1}:G${stmtRow + 2}`);
    const stmtBody = ws1.getCell(`A${stmtRow + 1}`);
    stmtBody.value = `"${data.strategicAlignmentStatement || "Advances Langara's Digital Roadmap by modernizing information management, strengthening collaboration, and enabling a more secure, compliant and efficient service environment."}"`;
    stmtBody.font = { name: "Segoe UI", size: 10, italic: true, color: { argb: "1E293B" } };
    stmtBody.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFDF9" } };
    stmtBody.alignment = { vertical: "middle", wrapText: true, indent: 1 };
    applyCellBorder(stmtBody);

    ws1.columns = [
      { width: 30 },
      { width: 22 },
      { width: 22 },
      { width: 18 },
      { width: 25 },
      { width: 25 },
      { width: 25 }
    ];

    // =========================================================================
    // SHEET 2: BENEFITS SCORECARD (B1 - B9)
    // =========================================================================
    const ws2 = wb.addWorksheet("Benefits Scorecard", {
      views: [{ showGridLines: true, state: "frozen", ySplit: 4 }]
    });

    ws2.mergeCells("A2:F2");
    const scTitle = ws2.getCell("A2");
    scTitle.value = "STRATEGIC BENEFITS SCORECARD (DRIVERS B1 – B9)";
    scTitle.font = { name: "Segoe UI", size: 13, bold: true, color: { argb: "FFFFFF" } };
    scTitle.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "E65100" } };
    scTitle.alignment = { vertical: "middle", indent: 1 };
    ws2.getRow(2).height = 30;

    const scThRow = ws2.getRow(4);
    scThRow.values = ["Driver ID", "Strategic Driver Name", "Target (0–5)", "Current Score", "Status", "Operational Evidence & Metrics"];
    scThRow.height = 26;
    scThRow.eachCell((c) => {
      c.font = { name: "Segoe UI", size: 10.5, bold: true, color: { argb: "FFFFFF" } };
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "0F172A" } };
      c.alignment = { horizontal: "center", vertical: "middle" };
      applyCellBorder(c, "0F172A");
    });
    scThRow.getCell(2).alignment = { horizontal: "left", vertical: "middle", indent: 1 };
    scThRow.getCell(6).alignment = { horizontal: "left", vertical: "middle", indent: 1 };

    (data.scorecard || []).forEach((b, idx) => {
      const rNum = 5 + idx;
      const row = ws2.getRow(rNum);
      row.values = [b.driverId, b.name, b.target || 5.0, b.score, b.status, b.evidence];
      row.height = 23;
      const isZebra = idx % 2 === 1;
      const rowBg = isZebra ? "F8FAFC" : "FFFFFF";

      const cId = row.getCell(1);
      cId.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "E65100" } };
      cId.alignment = { horizontal: "center", vertical: "middle" };
      cId.fill = { type: "pattern", pattern: "solid", fgColor: { argb: rowBg } };
      applyCellBorder(cId);

      const cName = row.getCell(2);
      cName.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "0F172A" } };
      cName.alignment = { vertical: "middle", indent: 1 };
      cName.fill = { type: "pattern", pattern: "solid", fgColor: { argb: rowBg } };
      applyCellBorder(cName);

      const cTgt = row.getCell(3);
      cTgt.font = { name: "Segoe UI", size: 10, color: { argb: "64748B" } };
      cTgt.alignment = { horizontal: "center", vertical: "middle" };
      cTgt.fill = { type: "pattern", pattern: "solid", fgColor: { argb: rowBg } };
      applyCellBorder(cTgt);

      const cScore = row.getCell(4);
      cScore.font = { name: "Segoe UI", size: 11, bold: true, color: { argb: "0F172A" } };
      cScore.alignment = { horizontal: "center", vertical: "middle" };
      cScore.fill = { type: "pattern", pattern: "solid", fgColor: { argb: rowBg } };
      applyCellBorder(cScore);

      const cStatus = row.getCell(5);
      styleStatusCell(cStatus, b.status);

      const cEv = row.getCell(6);
      cEv.font = { name: "Segoe UI", size: 9.5, color: { argb: "334155" } };
      cEv.alignment = { vertical: "middle", indent: 1 };
      cEv.fill = { type: "pattern", pattern: "solid", fgColor: { argb: rowBg } };
      applyCellBorder(cEv);
    });

    // Summary Mean Row
    const meanRowNum = 5 + (data.scorecard || []).length;
    const meanRow = ws2.getRow(meanRowNum);
    meanRow.values = ["MEAN", "Program Score Realization Average", 5.0, data.overallScore, "78% INDEX", "Provisional Scorecard Average (Gate 2/3)"];
    meanRow.height = 25;
    meanRow.eachCell((c) => {
      c.font = { name: "Segoe UI", size: 10.5, bold: true, color: { argb: "0F172A" } };
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF7ED" } };
      applyCellBorder(c, "E2E8F0");
    });
    meanRow.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
    meanRow.getCell(3).alignment = { horizontal: "center", vertical: "middle" };
    meanRow.getCell(4).alignment = { horizontal: "center", vertical: "middle" };
    meanRow.getCell(4).font = { name: "Segoe UI", size: 12, bold: true, color: { argb: "E65100" } };
    meanRow.getCell(5).alignment = { horizontal: "center", vertical: "middle" };

    ws2.columns = [
      { width: 14 },
      { width: 34 },
      { width: 16 },
      { width: 16 },
      { width: 18 },
      { width: 62 }
    ];

    // =========================================================================
    // SHEET 3: STAGE-GATE CHECKPOINTS
    // =========================================================================
    const ws3 = wb.addWorksheet("Stage-Gate Checkpoints", {
      views: [{ showGridLines: true, state: "frozen", ySplit: 4 }]
    });

    ws3.mergeCells("A2:F2");
    const cpTitle = ws3.getCell("A2");
    cpTitle.value = "STAGE-GATE BENEFIT CHECKPOINTS ROADMAP";
    cpTitle.font = { name: "Segoe UI", size: 13, bold: true, color: { argb: "FFFFFF" } };
    cpTitle.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "E65100" } };
    cpTitle.alignment = { vertical: "middle", indent: 1 };
    ws3.getRow(2).height = 30;

    const cpThRow = ws3.getRow(4);
    cpThRow.values = ["Checkpoint #", "Review Phase Name", "Target Review Date", "Provisional Score", "Stage Status", "Review Gate Notes & Milestones"];
    cpThRow.height = 26;
    cpThRow.eachCell((c) => {
      c.font = { name: "Segoe UI", size: 10.5, bold: true, color: { argb: "FFFFFF" } };
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "0F172A" } };
      c.alignment = { horizontal: "center", vertical: "middle" };
      applyCellBorder(c, "0F172A");
    });
    cpThRow.getCell(2).alignment = { horizontal: "left", vertical: "middle", indent: 1 };
    cpThRow.getCell(6).alignment = { horizontal: "left", vertical: "middle", indent: 1 };

    (data.checkpoints || []).forEach((cp, idx) => {
      const rNum = 5 + idx;
      const row = ws3.getRow(rNum);
      const isActive = Number(cp.checkpointNumber) === Number(data.activeCheckpointNumber);
      row.values = [
        `Checkpoint ${cp.checkpointNumber}`,
        cp.name,
        cp.targetDate,
        cp.score ? `${cp.score} / 5.0` : "TBD",
        cp.status,
        cp.notes
      ];
      row.height = 24;

      const rowBg = isActive ? "FFF7ED" : (idx % 2 === 1 ? "F8FAFC" : "FFFFFF");

      row.eachCell((c, cIdx) => {
        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: rowBg } };
        c.font = { name: "Segoe UI", size: 10, color: { argb: "0F172A" } };
        applyCellBorder(c);
      });

      row.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(1).font = { name: "Segoe UI", size: 10, bold: true, color: { argb: isActive ? "E65100" : "0F172A" } };
      row.getCell(3).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(4).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(4).font = { name: "Segoe UI", size: 10.5, bold: true, color: { argb: isActive ? "E65100" : "0F172A" } };

      const cStatus = row.getCell(5);
      styleStatusCell(cStatus, cp.status);
    });

    ws3.columns = [
      { width: 18 },
      { width: 28 },
      { width: 22 },
      { width: 18 },
      { width: 18 },
      { width: 55 }
    ];

    // =========================================================================
    // SHEET 4: INFORMATION HYGIENE & OUTCOMES
    // =========================================================================
    const ws4 = wb.addWorksheet("Hygiene & Outcomes", {
      views: [{ showGridLines: true, state: "frozen", ySplit: 4 }]
    });

    ws4.mergeCells("A2:F2");
    const hygTitle = ws4.getCell("A2");
    hygTitle.value = "KEY OPERATIONAL OUTCOMES & INFORMATION HYGIENE (POST-GO-LIVE)";
    hygTitle.font = { name: "Segoe UI", size: 13, bold: true, color: { argb: "FFFFFF" } };
    hygTitle.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "E65100" } };
    hygTitle.alignment = { vertical: "middle", indent: 1 };
    ws4.getRow(2).height = 30;

    const hygThRow = ws4.getRow(4);
    hygThRow.values = ["Metric Dimension", "Pre-Migration Baseline", "Post-Go-Live Current", "Percentage Improvement", "Operational Status", "Business Impact"];
    hygThRow.height = 26;
    hygThRow.eachCell((c) => {
      c.font = { name: "Segoe UI", size: 10.5, bold: true, color: { argb: "FFFFFF" } };
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "0F172A" } };
      c.alignment = { horizontal: "center", vertical: "middle" };
      applyCellBorder(c, "0F172A");
    });
    hygThRow.getCell(1).alignment = { horizontal: "left", vertical: "middle", indent: 1 };
    hygThRow.getCell(6).alignment = { horizontal: "left", vertical: "middle", indent: 1 };

    const hygieneData = [
      ["Folder Architecture (Total Folders)", data.outcomes?.folderCount?.baseline || 541, data.outcomes?.folderCount?.current || 44, `${data.outcomes?.folderCount?.percentChange || -91.9}%`, "Simpler Structure", "Maximum folder depth collapsed from 8 levels to 2; drastically reduced click fatigue."],
      ["Duplicate File Hygiene", data.outcomes?.duplicateFiles?.baseline || 117, data.outcomes?.duplicateFiles?.current || 49, `${data.outcomes?.duplicateFiles?.percentChange || -58.1}%`, "Less Redundancy", "Reduces storage sprawl and eliminates confusion regarding single source of truth."],
      ["Generic / Ambiguous Filenames", data.outcomes?.genericNames?.baseline || 347, data.outcomes?.genericNames?.current || 41, `${data.outcomes?.genericNames?.percentChange || -88.2}%`, "Better Findability", "M365 enterprise search yields relevant documents instantly."],
      ["Everyone Access Grants", 0, data.outcomes?.everyoneGrants || 0, "0 grants", "Governance Enforced", "Zero unauthorized open grants; confidentiality baseline maintained."],
      ["Folder-Level Security Exceptions", 0, data.outcomes?.folderExceptions || 0, "0 exceptions", "Clean Permissions", "Strict site-level permission inheritance preventing accidental privilege escalation."],
      ["Staff Training Completion", "-", `${data.outcomes?.trainedStaff || 10} / ${data.outcomes?.totalStaff || 10}`, "100%", "Full Adoption", "All PRM site owners and members fully trained on modern SharePoint practices."],
      ["Active Collaboration Files in Cloud", "-", data.outcomes?.activeFiles || 227, "-", "Active Adoption", "Documents transitioned from local drives into managed Microsoft 365 cloud collaboration."]
    ];

    hygieneData.forEach((h, idx) => {
      const rNum = 5 + idx;
      const row = ws4.getRow(rNum);
      row.values = [h[0], h[1], h[2], h[3], h[4], h[5]];
      row.height = 24;
      const rowBg = idx % 2 === 1 ? "F8FAFC" : "FFFFFF";

      row.eachCell((c) => {
        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: rowBg } };
        c.font = { name: "Segoe UI", size: 10, color: { argb: "0F172A" } };
        applyCellBorder(c);
      });

      row.getCell(2).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(3).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(3).font = { name: "Segoe UI", size: 10.5, bold: true, color: { argb: "0F172A" } };
      row.getCell(4).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(4).font = { name: "Segoe UI", size: 10.5, bold: true, color: { argb: "E65100" } };

      const cStatus = row.getCell(5);
      styleStatusCell(cStatus, h[4]);
    });

    ws4.columns = [
      { width: 34 },
      { width: 24 },
      { width: 22 },
      { width: 22 },
      { width: 22 },
      { width: 55 }
    ];

    // =========================================================================
    // SHEET 5: STEERING ACTIONS & ATTENTION
    // =========================================================================
    const ws5 = wb.addWorksheet("Needs Attention", {
      views: [{ showGridLines: true, state: "frozen", ySplit: 4 }]
    });

    ws5.mergeCells("A2:G2");
    const naTitle = ws5.getCell("A2");
    naTitle.value = "STEERING COMMITTEE FOCUS AREAS & ACTION RECOMMENDATIONS";
    naTitle.font = { name: "Segoe UI", size: 13, bold: true, color: { argb: "FFFFFF" } };
    naTitle.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "E65100" } };
    naTitle.alignment = { vertical: "middle", indent: 1 };
    ws5.getRow(2).height = 30;

    const naThRow = ws5.getRow(4);
    naThRow.values = ["Action ID", "Focus Category", "Severity", "Security Health Status", "Observed Issue", "Business Impact", "Prescribed Action Recommendation"];
    naThRow.height = 26;
    naThRow.eachCell((c) => {
      c.font = { name: "Segoe UI", size: 10.5, bold: true, color: { argb: "FFFFFF" } };
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "0F172A" } };
      c.alignment = { horizontal: "center", vertical: "middle" };
      applyCellBorder(c, "0F172A");
    });
    naThRow.getCell(5).alignment = { horizontal: "left", vertical: "middle", indent: 1 };
    naThRow.getCell(6).alignment = { horizontal: "left", vertical: "middle", indent: 1 };
    naThRow.getCell(7).alignment = { horizontal: "left", vertical: "middle", indent: 1 };

    (data.needsAttention || []).forEach((na, idx) => {
      const rNum = 5 + idx;
      const row = ws5.getRow(rNum);
      row.values = [
        na.id || `PRIORITY-${idx + 1}`,
        na.title || na.category,
        na.severity || "MEDIUM",
        na.healthStatus || "Weak",
        na.issue,
        na.impact,
        na.recommendation
      ];
      row.height = 32;
      const rowBg = idx % 2 === 1 ? "F8FAFC" : "FFFFFF";

      row.eachCell((c) => {
        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: rowBg } };
        c.font = { name: "Segoe UI", size: 10, color: { argb: "0F172A" } };
        applyCellBorder(c);
      });

      row.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(1).font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "E65100" } };

      const cSev = row.getCell(3);
      styleStatusCell(cSev, na.severity);

      const cHealth = row.getCell(4);
      styleStatusCell(cHealth, na.healthStatus);

      row.getCell(5).alignment = { vertical: "middle", wrapText: true, indent: 1 };
      row.getCell(6).alignment = { vertical: "middle", wrapText: true, indent: 1 };
      row.getCell(7).alignment = { vertical: "middle", wrapText: true, indent: 1 };
      row.getCell(7).font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "0F172A" } };
    });

    ws5.columns = [
      { width: 16 },
      { width: 28 },
      { width: 16 },
      { width: 22 },
      { width: 38 },
      { width: 38 },
      { width: 50 }
    ];

    const buffer = await wb.xlsx.writeBuffer();

    res.setHeader("Content-Disposition", `attachment; filename="${data.orgName.replace(/\s+/g, '_')}_Benefits_Realization_Scorecard.xlsx"`);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    return res.send(Buffer.from(buffer));
  } catch (error) {
    console.error("[BENEFITS EXPORT ERROR]", error);
    return res.status(500).json({ message: "Failed to export Excel report", error: error.message });
  }
};
