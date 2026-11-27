import BenefitsRealization from "../models/benefitsRealization.model.js";
import ExcelJS from "exceljs";
import JSZip from "jszip";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const escapeRegex = (str) => (str || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Resilient document finder with automatic alias & fallback resolution
 * @param {string} orgTarget - Target organization name
 * @param {boolean} lean - Whether to return plain JS object
 * @param {boolean} allowFallback - Fallback to demo orgs (Langara/WTEC) on reads ONLY; MUST be false for mutations
 */
const findBenefitsDoc = async (orgTarget, lean = false, allowFallback = true) => {
  const cleanTarget = (orgTarget || "").trim();
  if (!cleanTarget) {
    if (allowFallback) {
      let fallbackQuery = BenefitsRealization.findOne({
        orgName: { $in: ["Langara College", "WTEC"] }
      });
      if (lean) fallbackQuery = fallbackQuery.lean();
      return await fallbackQuery;
    }
    return null;
  }

  let query = BenefitsRealization.findOne({
    orgName: { $regex: new RegExp(`^${escapeRegex(cleanTarget)}$`, "i") }
  });
  if (lean) query = query.lean();
  let record = await query;

  if (!record && allowFallback) {
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
    // Security check: Guests/invitees and unauthenticated requests cannot mutate steering committee checkpoints
    if (!req.user || req.guest) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only authenticated administrators can update review checkpoints."
      });
    }

    const { orgName, checkpointNumber } = req.body;
    const targetCheckpoint = Number(checkpointNumber);

    if (!targetCheckpoint || targetCheckpoint < 1 || targetCheckpoint > 5) {
      return res.status(400).json({
        success: false,
        message: "Invalid checkpointNumber. Must be between 1 and 5."
      });
    }

    const isSuperAdmin = req.user?.role?.toLowerCase() === "superadmin";
    const orgTarget =
      isSuperAdmin && orgName ? orgName : orgName || req.user?.orgName || "Langara College";
    const record = await findBenefitsDoc(orgTarget, false, false);

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
    // Security check: Guests/invitees and unauthenticated requests cannot mutate steering committee drivers
    if (!req.user || req.guest) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only authenticated administrators can update scorecard drivers."
      });
    }

    const { orgName, driverId, score, status, evidence } = req.body;

    if (!driverId || score === undefined) {
      return res.status(400).json({
        success: false,
        message: "driverId and score are required."
      });
    }

    const isSuperAdmin = req.user?.role?.toLowerCase() === "superadmin";
    const orgTarget =
      isSuperAdmin && orgName ? orgName : orgName || req.user?.orgName || "Langara College";
    const record = await findBenefitsDoc(orgTarget, false, false);

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

    // Keep active checkpoint score synchronized with recalculated overall score
    const activeCp = record.checkpoints?.find(
      (cp) => Number(cp.checkpointNumber) === Number(record.activeCheckpointNumber)
    );
    if (activeCp) {
      activeCp.score = meanScore;
    }

    // Dynamically recalculate Strategic Priority roll-up totals and averages in programRollup
    if (record.programRollup && Array.isArray(record.programRollup.strategicPriorities)) {
      record.programRollup.strategicPriorities.forEach((sp) => {
        const matched = record.scorecard.filter(
          (d) => (d.strategicPriority || "").toLowerCase() === (sp.priority || "").toLowerCase()
        );
        if (matched.length > 0) {
          const sum = matched.reduce((acc, d) => acc + (Number(d.score) || 0), 0);
          sp.totalScore = Number(sum.toFixed(1));
          sp.maxScore = matched.length * 5.0;
          sp.averageScore = Number((sum / matched.length).toFixed(1));
          sp.benefitCount = matched.length;
        }
      });
    }

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
    // Security check: Guests/invitees and unauthenticated requests cannot mutate steering committee action recommendations
    if (!req.user || req.guest) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only authenticated administrators can update action recommendations."
      });
    }

    const { orgName, id, recommendation, severity, healthStatus } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "id is required."
      });
    }

    const isSuperAdmin = req.user?.role?.toLowerCase() === "superadmin";
    const orgTarget =
      isSuperAdmin && orgName ? orgName : orgName || req.user?.orgName || "Langara College";
    const record = await findBenefitsDoc(orgTarget, false, false);

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
 * @desc    Update governance configuration (scoring methodology, thresholds, RAG colors)
 * @route   PUT /api/v1/benefits/governance-config
 * @access  Private (SuperAdmin only)
 */
export const updateGovernanceConfig = async (req, res) => {
  try {
    const isSuperAdmin = req.user?.role?.toLowerCase() === "superadmin";
    if (!isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only SuperAdmin can configure governance rules and thresholds."
      });
    }

    const { orgName, governanceConfig } = req.body;
    if (!governanceConfig) {
      return res.status(400).json({
        success: false,
        message: "governanceConfig object is required."
      });
    }

    const orgTarget = orgName || req.user?.orgName || "Langara College";
    const record = await findBenefitsDoc(orgTarget, false, false);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: `Benefits Realization record for '${orgTarget}' not found.`
      });
    }

    record.governanceConfig = {
      ...(record.governanceConfig?.toObject?.() || {}),
      ...governanceConfig
    };

    // If thresholds include driverScore, evaluate all driver statuses dynamically
    if (Array.isArray(governanceConfig.thresholds)) {
      const driverThresh = governanceConfig.thresholds.find((t) => t.key === "driverScore");
      if (driverThresh && Array.isArray(record.scorecard)) {
        record.scorecard.forEach((d) => {
          const sc = Number(d.score) || 0;
          if (sc >= (driverThresh.greenMin || 4.0)) {
            d.status = "On Track";
          } else if (sc >= (driverThresh.amberMin || 3.5)) {
            d.status = "Monitor";
          } else {
            d.status = "Needs Attention";
          }
        });
      }
    }

    await record.save();

    return res.status(200).json({
      success: true,
      message: "Governance configuration and thresholds updated successfully.",
      data: record
    });
  } catch (error) {
    console.error("[BENEFITS GOVERNANCE CONFIG UPDATE ERROR]", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update governance configuration",
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

  if (
    norm.includes("TRACK") ||
    norm.includes("COMPLETED") ||
    norm.includes("VERIFIED") ||
    norm.includes("ENFORCED") ||
    norm.includes("ADOPTION")
  ) {
    bg = "E8F8EE";
    fg = "1E824C";
  } else if (norm.includes("PROGRESS") || norm.includes("ACTIVE")) {
    bg = "EBF5FB";
    fg = "1D4ED8";
  } else if (norm.includes("MONITOR") || norm.includes("MEDIUM")) {
    bg = "FFF9E6";
    fg = "B45309";
  } else if (
    norm.includes("CRITICAL") ||
    norm.includes("RISK") ||
    norm.includes("HIGH") ||
    norm.includes("WEAK")
  ) {
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
    subCell.value =
      "Admin Group 1 — Privacy & Records Management (PRM) • 90-Day Post-Go-Live Review Gate";
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
      [
        "Overall Program Score",
        `${data.overallScore} / ${data.targetScore || 5.0}`,
        "Realization Index",
        `${data.realizationPercentage || 78}%`,
        "Status",
        "Progressing (On Track for Closure)"
      ],
      [
        "Active Review Stage",
        `Checkpoint ${data.activeCheckpointNumber} (90-Day Review)`,
        "Target Review Date",
        "November 2026",
        "Governance",
        "Steering Committee Active"
      ],
      [
        "Folder Count Reduction",
        `${data.outcomes?.folderCount?.baseline || 541} ➔ ${data.outcomes?.folderCount?.current || 44}`,
        "Reduction Rate",
        `${data.outcomes?.folderCount?.percentChange || -91.9}%`,
        "Structure",
        "Flatter Depth (8 ➔ 2)"
      ],
      [
        "Duplicate File Hygiene",
        `${data.outcomes?.duplicateFiles?.baseline || 117} ➔ ${data.outcomes?.duplicateFiles?.current || 49}`,
        "Reduction Rate",
        `${data.outcomes?.duplicateFiles?.percentChange || -58.1}%`,
        "Hygiene",
        "Less Redundancy"
      ],
      [
        "Generic Filenames",
        `${data.outcomes?.genericNames?.baseline || 347} ➔ ${data.outcomes?.genericNames?.current || 41}`,
        "Reduction Rate",
        `${data.outcomes?.genericNames?.percentChange || -88.2}%`,
        "Findability",
        "Standardized Metadata"
      ],
      [
        "Access Control Grants",
        "0 'Everyone' grants",
        "Folder Exceptions",
        "0 Exceptions",
        "Compliance",
        "BC FIPPA Baseline Enforced"
      ],
      [
        "Staff Training Adoption",
        `${data.outcomes?.trainedStaff || 10} / ${data.outcomes?.totalStaff || 10}`,
        "Adoption Rate",
        "100%",
        "Enablement",
        "All Site Owners Trained"
      ]
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
    pThRow.values = [
      "Pillar Dimension",
      "Health Status",
      "Target",
      "Score",
      "Performance Summary",
      "",
      ""
    ];
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
    scThRow.values = [
      "Driver ID",
      "Strategic Driver Name",
      "Target (0–5)",
      "Current Score",
      "Status",
      "Operational Evidence & Metrics"
    ];
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
    const liveMeanPct = Math.round(Number(data.realizationPercentage) || 78);
    meanRow.values = [
      "MEAN",
      "Health Scorecard Average",
      5.0,
      data.overallScore,
      `${liveMeanPct}% INDEX`,
      "Active Gate 2/3 Benchmark Satisfied; Transition Authorized to Checkpoint 4."
    ];
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
    cpThRow.values = [
      "Checkpoint #",
      "Review Phase Name",
      "Target Review Date",
      "Provisional Score",
      "Stage Status",
      "Review Gate Notes & Milestones"
    ];
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
      const cpNum = Number(cp.checkpointNumber);
      const scoreDisplay = cp.score
        ? `${Number(cp.score).toFixed(1)} / 5.0`
        : cpNum === 1
          ? "n/a / 5.0"
          : "TBC / 5.0";
      row.values = [
        `Checkpoint ${cp.checkpointNumber}`,
        cp.name,
        cp.targetDate,
        scoreDisplay,
        cp.status,
        cp.notes
      ];
      row.height = 24;

      const rowBg = isActive ? "FFF7ED" : idx % 2 === 1 ? "F8FAFC" : "FFFFFF";

      row.eachCell((c, cIdx) => {
        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: rowBg } };
        c.font = { name: "Segoe UI", size: 10, color: { argb: "0F172A" } };
        applyCellBorder(c);
      });

      row.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(1).font = {
        name: "Segoe UI",
        size: 10,
        bold: true,
        color: { argb: isActive ? "E65100" : "0F172A" }
      };
      row.getCell(3).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(4).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(4).font = {
        name: "Segoe UI",
        size: 10.5,
        bold: true,
        color: { argb: isActive ? "E65100" : "0F172A" }
      };

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
    hygThRow.values = [
      "Metric Dimension",
      "Pre-Migration Baseline",
      "Post-Go-Live Current",
      "Percentage Improvement",
      "Operational Status",
      "Business Impact"
    ];
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
      [
        "Folder Architecture (Total Folders)",
        data.outcomes?.folderCount?.baseline || 541,
        data.outcomes?.folderCount?.current || 44,
        `${data.outcomes?.folderCount?.percentChange || -91.9}%`,
        "Simpler Structure",
        "Maximum folder depth collapsed from 8 levels to 2; drastically reduced click fatigue."
      ],
      [
        "ROT (Redundant, Obsolete, Trivial) Files",
        2175,
        1300,
        "-40.2%",
        "Hygiene Target",
        "40.2% ROT files eliminated (target: 50%); ongoing archiving in progress."
      ],
      [
        "Duplicate File Hygiene",
        data.outcomes?.duplicateFiles?.baseline || 117,
        data.outcomes?.duplicateFiles?.current || 49,
        `${data.outcomes?.duplicateFiles?.percentChange || -58.1}%`,
        "Less Redundancy",
        "Reduces storage sprawl and eliminates confusion regarding single source of truth."
      ],
      [
        "Generic / Ambiguous Filenames",
        data.outcomes?.genericNames?.baseline || 347,
        data.outcomes?.genericNames?.current || 41,
        `${data.outcomes?.genericNames?.percentChange || -88.2}%`,
        "Better Findability",
        "M365 enterprise search yields relevant documents instantly."
      ],
      [
        "Total Storage Footprint",
        "3.90 GB",
        "3.31 GB",
        "-15.1%",
        "Cost Efficiency",
        "Cloud storage footprint decreased by 15.1% through pre-migration cleanup."
      ],
      [
        "Version Token Filenames ('v2/final/draft')",
        468,
        607,
        "+29.7%",
        "Monitor / Habit",
        "Staff manual versioning habit under active monitoring; co-authoring & OneDrive sync clinics scheduled."
      ],
      [
        "Everyone Access Grants",
        0,
        data.outcomes?.everyoneGrants || 0,
        "0 grants",
        "Governance Enforced",
        "Zero unauthorized open grants; confidentiality baseline maintained."
      ],
      [
        "Folder-Level Security Exceptions",
        0,
        data.outcomes?.folderExceptions || 0,
        "0 exceptions",
        "Clean Permissions",
        "Strict site-level permission inheritance preventing accidental privilege escalation."
      ],
      [
        "Staff Training Completion",
        "-",
        `${data.outcomes?.trainedStaff || 1151} / ${data.outcomes?.totalStaff || 1151}`,
        "100%",
        "Full Adoption",
        "All PRM site owners and members fully trained on modern SharePoint practices."
      ],
      [
        "Active Collaboration Files in Cloud",
        "-",
        data.outcomes?.activeFiles || 227,
        "-",
        "Active Adoption",
        "Documents transitioned from local drives into managed Microsoft 365 cloud collaboration."
      ]
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
    naThRow.values = [
      "Action ID",
      "Focus Category",
      "Severity",
      "Security Health Status",
      "Observed Issue",
      "Business Impact",
      "Prescribed Action Recommendation"
    ];
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

    // =========================================================================
    // SHEET 6: SURVEY EMPIRICAL RESULTS (n=2, Nov 4, 2026)
    // =========================================================================
    const ws6 = wb.addWorksheet("Survey Results", {
      views: [{ showGridLines: true, state: "frozen", ySplit: 4 }]
    });

    ws6.mergeCells("A2:G2");
    const surTitle = ws6.getCell("A2");
    surTitle.value = "PRM POST-IMPLEMENTATION SURVEY EMPIRICAL RESULTS (n=2, Nov 4, 2026)";
    surTitle.font = { name: "Segoe UI", size: 13, bold: true, color: { argb: "FFFFFF" } };
    surTitle.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "E65100" } };
    surTitle.alignment = { vertical: "middle", indent: 1 };
    ws6.getRow(2).height = 30;

    ws6.mergeCells("A3:G3");
    const surSub = ws6.getCell("A3");
    surSub.value =
      "One PRM Site Owner & One Site Member • Directional feedback on 1–5 Agreement scale (Floor: 3.0, Target: 4.0)";
    surSub.font = { name: "Segoe UI", size: 9.5, italic: true, color: { argb: "475569" } };
    surSub.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF7ED" } };
    surSub.alignment = { vertical: "middle", indent: 1 };
    ws6.getRow(3).height = 20;

    const surThRow = ws6.getRow(4);
    surThRow.values = [
      "Domain",
      "Survey Question (Exact Wording)",
      "Benefit Link",
      "Site Owner",
      "Site Member",
      "Mean (1–5)",
      "Floor Status"
    ];
    surThRow.height = 26;
    surThRow.eachCell((c) => {
      c.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFFFFF" } };
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "0F172A" } };
      c.alignment = { horizontal: "center", vertical: "middle" };
      applyCellBorder(c, "0F172A");
    });
    surThRow.getCell(2).alignment = { horizontal: "left", vertical: "middle", indent: 1 };

    const surveyQuestions = [
      [
        "Site ownership",
        "I feel confident managing access and permissions for the SharePoint site.",
        "B2; B8",
        4,
        "-",
        4.0,
        "On Target"
      ],
      [
        "Site ownership",
        "I feel confident maintaining the site’s document organization and metadata.",
        "B7; B8",
        5,
        "-",
        5.0,
        "Above Target"
      ],
      [
        "Support confidence",
        "I know where to go for help when I cannot resolve a SharePoint issue myself.",
        "B3; B8",
        4,
        "-",
        4.0,
        "On Target"
      ],
      [
        "Findability",
        "It is easier to find the documents and information I need.",
        "B5",
        3,
        4,
        3.5,
        "Above Floor (3.0)"
      ],
      [
        "Storage clarity",
        "It is clear to me where documents should be stored.",
        "B7; B8",
        5,
        4,
        4.5,
        "Above Target"
      ],
      [
        "Organization",
        "Documents are better organized than they were before.",
        "B7",
        3,
        4,
        3.5,
        "Above Floor (3.0)"
      ],
      [
        "Metadata effectiveness",
        "Using metadata makes it easier to organize and find documents.",
        "B5; B7",
        4,
        4,
        4.0,
        "On Target"
      ],
      [
        "Version control",
        "It is easier to identify and work with the correct version of a document.",
        "B1; B5",
        5,
        4,
        4.5,
        "Above Target"
      ],
      [
        "Collaboration",
        "It is easier to share and collaborate on documents with others.",
        "B1; B6",
        4,
        4,
        4.0,
        "On Target"
      ],
      [
        "Secure access",
        "I am confident that sensitive information is only accessible to the right people.",
        "B2",
        5,
        4,
        4.5,
        "Above Target"
      ],
      [
        "Remote work",
        "The new SharePoint site has made my day-to-day work easier both in-office and while working off-site.",
        "B4; B6",
        3,
        4,
        3.5,
        "Above Floor (3.0)"
      ],
      [
        "Communications",
        "I received the information I needed at the right time during the transition.",
        "B8",
        4,
        4,
        4.0,
        "On Target"
      ],
      [
        "Training",
        "The training prepared me to use the new SharePoint site effectively.",
        "B8",
        5,
        4,
        4.5,
        "Above Target"
      ],
      [
        "Support",
        "I knew where to go for help or support when I needed it.",
        "B3; B8",
        5,
        4,
        4.5,
        "Above Target"
      ],
      [
        "Engagement",
        "I had opportunities to provide input during the design through to transition.",
        "B8",
        5,
        4,
        4.5,
        "Above Target"
      ],
      [
        "Client needs",
        "The project team understood our department’s needs and concerns.",
        "B8",
        5,
        4,
        4.5,
        "Above Target"
      ]
    ];

    surveyQuestions.forEach((sq, idx) => {
      const rNum = 5 + idx;
      const row = ws6.getRow(rNum);
      row.values = [sq[0], sq[1], sq[2], sq[3], sq[4], sq[5], sq[6]];
      row.height = 22;
      const rowBg = idx % 2 === 1 ? "F8FAFC" : "FFFFFF";

      row.eachCell((c) => {
        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: rowBg } };
        c.font = { name: "Segoe UI", size: 9.5, color: { argb: "0F172A" } };
        applyCellBorder(c);
      });

      row.getCell(1).alignment = { vertical: "middle", indent: 1 };
      row.getCell(2).alignment = { vertical: "middle", indent: 1 };
      row.getCell(3).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(4).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(5).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(6).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(6).font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "E65100" } };

      const cStat = row.getCell(7);
      styleStatusCell(cStat, sq[6]);
    });

    // Site Owner Qualitative Feedback Callout Box
    const qualStartRow = 5 + surveyQuestions.length + 1;
    ws6.mergeCells(`A${qualStartRow}:G${qualStartRow}`);
    const qHeader = ws6.getCell(`A${qualStartRow}`);
    qHeader.value = "QUALITATIVE SITE OWNER USER OBSERVATIONS & ACTION CONTEXT";
    qHeader.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFFFFF" } };
    qHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "1E293B" } };
    qHeader.alignment = { vertical: "middle", indent: 1 };
    ws6.getRow(qualStartRow).height = 24;

    const qualRows = [
      [
        "What improved most",
        "Metadata has made it much easier to find documents related to a specific access to information request.",
        "Validation",
        "PRM Site Owner (Consent: Named)",
        "",
        "",
        ""
      ],
      [
        "What remains difficult",
        "I still need to learn how to sync my OneDrive with our SP site so I don't need to manually upload documents.",
        "Action Needed",
        "Root cause for v2/final/draft filename increase (468 ➔ 607)",
        "",
        "",
        ""
      ],
      [
        "General observation",
        "Because our N drive was well organized already, the main benefit of moving to SharePoint is improved search.",
        "Context",
        "M365 Enterprise search provides greatest user value",
        "",
        "",
        ""
      ]
    ];

    qualRows.forEach((qr, idx) => {
      const rNum = qualStartRow + 1 + idx;
      const row = ws6.getRow(rNum);
      row.values = [qr[0], qr[1], qr[2], qr[3], "", "", ""];
      ws6.mergeCells(`B${rNum}:C${rNum}`);
      ws6.mergeCells(`D${rNum}:G${rNum}`);
      row.height = 24;

      row.eachCell((c) => {
        c.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: idx === 1 ? "FFF7ED" : "FFFFFF" }
        };
        c.font = { name: "Segoe UI", size: 9.5, color: { argb: "0F172A" } };
        applyCellBorder(c);
      });

      row.getCell(1).font = {
        name: "Segoe UI",
        size: 9.5,
        bold: true,
        color: { argb: idx === 1 ? "D84315" : "0F172A" }
      };
      row.getCell(1).alignment = { vertical: "middle", indent: 1 };
      row.getCell(2).alignment = { vertical: "middle", indent: 1 };
      row.getCell(4).alignment = { vertical: "middle", indent: 1 };
      row.getCell(4).font = { name: "Segoe UI", size: 9, italic: true, color: { argb: "475569" } };
    });

    ws6.columns = [
      { width: 22 },
      { width: 55 },
      { width: 14 },
      { width: 14 },
      { width: 14 },
      { width: 14 },
      { width: 20 }
    ];

    // =========================================================================
    // SHEET 7: M365 TECHNICAL AUDIT (Nov 5, 2026)
    // =========================================================================
    const ws7 = wb.addWorksheet("Technical M365 Audit", {
      views: [{ showGridLines: true, state: "frozen", ySplit: 4 }]
    });

    ws7.mergeCells("A2:F2");
    const techTitle = ws7.getCell("A2");
    techTitle.value = "PRM SHAREPOINT & MICROSOFT 365 TECHNICAL AUDIT (Nov 5, 2026)";
    techTitle.font = { name: "Segoe UI", size: 13, bold: true, color: { argb: "FFFFFF" } };
    techTitle.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "E65100" } };
    techTitle.alignment = { vertical: "middle", indent: 1 };
    ws7.getRow(2).height = 30;

    const techThRow = ws7.getRow(4);
    techThRow.values = [
      "Technical Metric Dimension",
      "Pre-Migration Baseline",
      "Post-Migration Current",
      "Variance / Change",
      "Target Goal",
      "Technical Governance Finding"
    ];
    techThRow.height = 26;
    techThRow.eachCell((c) => {
      c.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFFFFF" } };
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "0F172A" } };
      c.alignment = { horizontal: "center", vertical: "middle" };
      applyCellBorder(c, "0F172A");
    });
    techThRow.getCell(1).alignment = { horizontal: "left", vertical: "middle", indent: 1 };
    techThRow.getCell(6).alignment = { horizontal: "left", vertical: "middle", indent: 1 };

    const techAuditData = [
      [
        "Folder Architecture (Total Folders)",
        541,
        44,
        "-91.9%",
        "Significant reduction",
        "Navigation hierarchy collapsed from 8 levels to 2; zero path length errors."
      ],
      [
        "Maximum Folder Depth",
        8,
        2,
        "-75.0%",
        "<= 3 levels",
        "Achieved optimal flat modern SharePoint structure."
      ],
      [
        "ROT Files (Redundant, Obsolete, Trivial)",
        2175,
        1300,
        "-40.2%",
        "50% reduction",
        "1,300 files remain in shared storage; secondary archiving phase in progress."
      ],
      [
        "Cloud Storage Footprint",
        "3.90 GB",
        "3.31 GB",
        "-15.1%",
        "20% reduction",
        "Storage footprint decreased by 0.59 GB; ongoing cleanup to reach 20%."
      ],
      [
        "Version-Token Filenames ('v2/final/draft')",
        468,
        607,
        "+29.7%",
        "0% growth",
        "Habitual naming under watch; OneDrive sync coaching clinics scheduled to stop manual uploads."
      ],
      [
        "Duplicate File Sprawl",
        117,
        49,
        "-58.1%",
        "Substantial reduction",
        "Duplicate information footprint reduced by more than half."
      ],
      [
        "Generic / Ambiguous Filenames",
        347,
        41,
        "-88.2%",
        "< 50 files",
        "High findability; document titles now conform to naming standard."
      ],
      [
        "Unlabelled Sensitive Documents",
        205,
        205,
        "0% labelled",
        "100% labelled",
        "Purview retention and sensitivity labels require automated policy deployment."
      ],
      [
        "'Everyone' Open Sharing Grants",
        0,
        0,
        "0 grants",
        "0 grants",
        "Strict boundary maintained; zero unintended external access grants."
      ],
      [
        "Folder-Level Permission Exceptions",
        0,
        0,
        "0 exceptions",
        "0 exceptions",
        "Clean site-level permission inheritance preventing privilege drift."
      ]
    ];

    techAuditData.forEach((ta, idx) => {
      const rNum = 5 + idx;
      const row = ws7.getRow(rNum);
      row.values = [ta[0], ta[1], ta[2], ta[3], ta[4], ta[5]];
      row.height = 23;
      const rowBg = idx % 2 === 1 ? "F8FAFC" : "FFFFFF";

      row.eachCell((c) => {
        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: rowBg } };
        c.font = { name: "Segoe UI", size: 9.5, color: { argb: "0F172A" } };
        applyCellBorder(c);
      });

      row.getCell(1).alignment = { vertical: "middle", indent: 1 };
      row.getCell(2).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(3).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(3).font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "0F172A" } };
      row.getCell(4).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(4).font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "E65100" } };
      row.getCell(5).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(6).alignment = { vertical: "middle", indent: 1 };
    });

    ws7.columns = [
      { width: 34 },
      { width: 22 },
      { width: 22 },
      { width: 20 },
      { width: 22 },
      { width: 55 }
    ];

    // =========================================================================
    // SHEET 8: GOVERNANCE, SCORING METHODOLOGY & RAG THRESHOLDS
    // =========================================================================
    const ws8 = wb.addWorksheet("RAG Thresholds & Governance", {
      views: [{ showGridLines: true, state: "frozen", ySplit: 4 }]
    });

    ws8.mergeCells("A2:F2");
    const govTitle = ws8.getCell("A2");
    govTitle.value = "CENTRALIZED GOVERNANCE CONFIGURATION, SCORING METHODOLOGY & RAG THRESHOLDS";
    govTitle.font = { name: "Segoe UI", size: 12.5, bold: true, color: { argb: "FFFFFF" } };
    govTitle.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "F15A22" } };
    govTitle.alignment = { vertical: "middle", indent: 1 };
    ws8.getRow(2).height = 30;

    // SECTION 1: 1-5 SCORING METHODOLOGY
    ws8.mergeCells("A4:F4");
    const mHead = ws8.getCell("A4");
    mHead.value = "1. 1–5 MATURITY & SCORING METHODOLOGY SPECIFICATION";
    mHead.font = { name: "Segoe UI", size: 10.5, bold: true, color: { argb: "FFFFFF" } };
    mHead.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "0F172A" } };
    mHead.alignment = { vertical: "middle", indent: 1 };
    ws8.getRow(4).height = 24;

    const mThRow = ws8.getRow(5);
    mThRow.values = [
      "Level",
      "Maturity Stage Label",
      "Detailed Operational Definition & Institutional Meaning",
      "Benchmark Range",
      "Theme Color",
      ""
    ];
    mThRow.height = 24;
    mThRow.eachCell((c) => {
      c.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: "0F172A" } };
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "F1F5F9" } };
      c.alignment = { horizontal: "center", vertical: "middle" };
      applyCellBorder(c);
    });
    mThRow.getCell(2).alignment = { horizontal: "left", vertical: "middle", indent: 1 };
    mThRow.getCell(3).alignment = { horizontal: "left", vertical: "middle", indent: 1 };

    const scoreDefs = data.governanceConfig?.scoringMethodology || [
      {
        level: 1,
        label: "Critical Gap",
        description: "Not started, severe adoption resistance, or compliance failure (<2.0)",
        color: "#D9534F"
      },
      {
        level: 2,
        label: "Emerging / Ad-hoc",
        description:
          "Early pilot adoption; manual processes persist; user coaching needed (2.0 - 2.9)",
        color: "#F29705"
      },
      {
        level: 3,
        label: "Established (Floor Met)",
        description: "Acceptable baseline operating floor; core functions in place (3.0 - 3.4)",
        color: "#FCB511"
      },
      {
        level: 4,
        label: "Advanced (Target Met)",
        description: "Target realized; consistent modern habits; strong compliance (3.5 - 4.4)",
        color: "#1E824C"
      },
      {
        level: 5,
        label: "Optimized / Exceeding",
        description:
          "Full institutional maturity; automated policies active; max efficiency (4.5 - 5.0)",
        color: "#155724"
      }
    ];

    scoreDefs.forEach((sd, idx) => {
      const rNum = 6 + idx;
      const row = ws8.getRow(rNum);
      const range =
        sd.level === 1
          ? "< 2.0"
          : sd.level === 2
            ? "2.0 – 2.9"
            : sd.level === 3
              ? "3.0 – 3.4"
              : sd.level === 4
                ? "3.5 – 4.4"
                : "4.5 – 5.0";
      row.values = [`Level ${sd.level}`, sd.label, sd.description, range, sd.color || "", ""];
      ws8.mergeCells(`C${rNum}:D${rNum}`);
      row.height = 22;
      row.eachCell((c) => {
        c.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: idx % 2 === 1 ? "F8FAFC" : "FFFFFF" }
        };
        c.font = { name: "Segoe UI", size: 9.5, color: { argb: "0F172A" } };
        applyCellBorder(c);
      });
      row.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(1).font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: "0F172A" } };
      row.getCell(2).alignment = { vertical: "middle", indent: 1 };
      row.getCell(2).font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: "0F172A" } };
      row.getCell(3).alignment = { vertical: "middle", indent: 1 };
      row.getCell(5).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(5).font = { name: "Segoe UI", size: 9, bold: true, color: { argb: "475569" } };
    });

    // SECTION 2: RAG PERFORMANCE THRESHOLDS
    const threshStartRow = 12;
    ws8.mergeCells(`A${threshStartRow}:F${threshStartRow}`);
    const tHead = ws8.getCell(`A${threshStartRow}`);
    tHead.value = "2. RAG PERFORMANCE THRESHOLDS & TECHNICAL TARGETS (SUPERADMIN CONFIGURABLE)";
    tHead.font = { name: "Segoe UI", size: 10.5, bold: true, color: { argb: "FFFFFF" } };
    tHead.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "0F172A" } };
    tHead.alignment = { vertical: "middle", indent: 1 };
    ws8.getRow(threshStartRow).height = 24;

    const tThRow = ws8.getRow(threshStartRow + 1);
    tThRow.values = [
      "Governance Dimension",
      "Green (On Track)",
      "Amber (Monitor)",
      "Red (Needs Attention)",
      "Current Realized Value",
      "Steering Verification Status"
    ];
    tThRow.height = 24;
    tThRow.eachCell((c) => {
      c.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: "0F172A" } };
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "F1F5F9" } };
      c.alignment = { horizontal: "center", vertical: "middle" };
      applyCellBorder(c);
    });
    tThRow.getCell(1).alignment = { horizontal: "left", vertical: "middle", indent: 1 };

    const thresholdsList = data.governanceConfig?.thresholds || [
      {
        title: "Driver Performance (/5.0)",
        greenCondition: "Score >= 4.0",
        amberCondition: "Score 3.5 - 3.9",
        redCondition: "Score < 3.5",
        currentValue: "3.9 / 5.0 Mean"
      },
      {
        title: "Survey Question Mean (/5.0)",
        greenCondition: "Mean >= 4.0 (Above Target)",
        amberCondition: "Mean 3.0 - 3.9 (Above Floor)",
        redCondition: "Mean < 3.0 (Below Floor)",
        currentValue: "4.1 / 5.0 Average"
      },
      {
        title: "Folder Architecture Hygiene",
        greenCondition: "Reduction >= 80%",
        amberCondition: "Reduction 50% - 79%",
        redCondition: "Reduction < 50%",
        currentValue: "91.9% Reduction"
      },
      {
        title: "Duplicate File Hygiene",
        greenCondition: "Reduction >= 50%",
        amberCondition: "Reduction 25% - 49%",
        redCondition: "Reduction < 25%",
        currentValue: "58.1% Reduction"
      },
      {
        title: "Open Access ('Everyone') Grants",
        greenCondition: "0 Grants (Zero Trust)",
        amberCondition: "1 - 5 Grants with review",
        redCondition: "> 5 Unapproved Grants",
        currentValue: "0 Grants"
      },
      {
        title: "Staff Training Enablement",
        greenCondition: "100% Completed",
        amberCondition: "80% - 99% Completed",
        redCondition: "< 80% Completed",
        currentValue: "100% Completed"
      },
      {
        title: "Purview Retention & Labelling",
        greenCondition: ">= 90% Labelled",
        amberCondition: "50% - 89% Labelled",
        redCondition: "< 50% Labelled",
        currentValue: "0% Labelled (RED)"
      }
    ];

    thresholdsList.forEach((th, idx) => {
      const rNum = threshStartRow + 2 + idx;
      const row = ws8.getRow(rNum);
      const isRed =
        (th.currentValue || "").toUpperCase().includes("RED") ||
        (th.currentValue || "").includes("0%");
      const statusNote = isRed ? "Remediation Required (Priority 1)" : "Benchmark Satisfied";
      row.values = [
        th.title,
        th.greenCondition,
        th.amberCondition,
        th.redCondition,
        th.currentValue,
        statusNote
      ];
      row.height = 22;
      row.eachCell((c) => {
        c.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: idx % 2 === 1 ? "F8FAFC" : "FFFFFF" }
        };
        c.font = { name: "Segoe UI", size: 9.5, color: { argb: "0F172A" } };
        applyCellBorder(c);
      });
      row.getCell(1).alignment = { vertical: "middle", indent: 1 };
      row.getCell(1).font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: "0F172A" } };
      row.getCell(2).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(2).font = { name: "Segoe UI", size: 9.5, color: { argb: "1E824C" } };
      row.getCell(3).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(3).font = { name: "Segoe UI", size: 9.5, color: { argb: "D97706" } };
      row.getCell(4).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(4).font = { name: "Segoe UI", size: 9.5, color: { argb: "DC2626" } };
      row.getCell(5).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(5).font = {
        name: "Segoe UI",
        size: 9.5,
        bold: true,
        color: { argb: isRed ? "DC2626" : "0F172A" }
      };
      row.getCell(6).alignment = { vertical: "middle", indent: 1 };
      row.getCell(6).font = {
        name: "Segoe UI",
        size: 9,
        italic: true,
        color: { argb: isRed ? "DC2626" : "475569" }
      };
    });

    // SECTION 3: FORMULA & REALIZATION INDEX SPECIFICATION
    const formStartRow = threshStartRow + 3 + thresholdsList.length;
    ws8.mergeCells(`A${formStartRow}:F${formStartRow}`);
    const fHead = ws8.getCell(`A${formStartRow}`);
    fHead.value = "3. REALIZATION INDEX MATHEMATICAL FORMULA SPECIFICATION";
    fHead.font = { name: "Segoe UI", size: 10.5, bold: true, color: { argb: "FFFFFF" } };
    fHead.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "0F172A" } };
    fHead.alignment = { vertical: "middle", indent: 1 };
    ws8.getRow(formStartRow).height = 24;

    const formRows = [
      [
        "Arithmetic Mean Program Score (/5.0)",
        "= SUM(Scorecard B1:B9) / 9 = 35.3 / 9 = 3.922 ➔ 3.9 / 5.0",
        "Core Headline Score",
        "Unweighted composite across 9 drivers"
      ],
      [
        "Realization Percentage Index (%)",
        "= (Program Score / Scale Max 5.0) * 100% = (3.922 / 5.0) * 100% = 78.44% ➔ 78%",
        "Normalized %",
        "Allows direct cross-program benchmarking across LDR"
      ],
      [
        "Health Status Determination",
        "Composite evaluation across 4 pillars (Delivery, Adoption, Benefits, Risk) + active threshold rules",
        "Multi-Dimensional",
        "Ensures high average cannot mask critical compliance gaps"
      ]
    ];

    formRows.forEach((fr, idx) => {
      const rNum = formStartRow + 1 + idx;
      const row = ws8.getRow(rNum);
      row.values = [fr[0], fr[1], fr[2], fr[3], "", ""];
      ws8.mergeCells(`B${rNum}:D${rNum}`);
      ws8.mergeCells(`E${rNum}:F${rNum}`);
      row.height = 23;
      row.eachCell((c) => {
        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFF" } };
        c.font = { name: "Segoe UI", size: 9.5, color: { argb: "0F172A" } };
        applyCellBorder(c);
      });
      row.getCell(1).alignment = { vertical: "middle", indent: 1 };
      row.getCell(1).font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: "0F172A" } };
      row.getCell(2).alignment = { vertical: "middle", indent: 1 };
      row.getCell(2).font = { name: "Consolas", size: 9.5, color: { argb: "1E293B" } };
      row.getCell(5).alignment = { vertical: "middle", indent: 1 };
      row.getCell(5).font = { name: "Segoe UI", size: 9, italic: true, color: { argb: "64748B" } };
    });

    ws8.columns = [
      { width: 32 },
      { width: 30 },
      { width: 28 },
      { width: 26 },
      { width: 24 },
      { width: 36 }
    ];

    // =========================================================================
    // SHEET 9: BENEFITS MAP & STRATEGIC PRIORITY ROLL-UP
    // =========================================================================
    const ws9 = wb.addWorksheet("Benefits Map & Alignment", {
      views: [{ showGridLines: true, state: "frozen", ySplit: 4 }]
    });

    ws9.mergeCells("A2:E2");
    const bmTitle = ws9.getCell("A2");
    bmTitle.value = "BENEFITS MAP — REVISED LANGARA STRATEGIC ALIGNMENT & PRIORITY ROLL-UP";
    bmTitle.font = { name: "Segoe UI", size: 12.5, bold: true, color: { argb: "FFFFFF" } };
    bmTitle.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "F15A22" } };
    bmTitle.alignment = { vertical: "middle", indent: 1 };
    ws9.getRow(2).height = 30;

    // Roll-up Summary Table
    ws9.mergeCells("A4:E4");
    const prHead = ws9.getCell("A4");
    prHead.value =
      "1. STRATEGIC PRIORITY ROLL-UP FOR DIAL GRAPHIC (PRIMARY ALIGNMENT — NO DOUBLE COUNTING)";
    prHead.font = { name: "Segoe UI", size: 10.5, bold: true, color: { argb: "FFFFFF" } };
    prHead.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "0F172A" } };
    prHead.alignment = { vertical: "middle", indent: 1 };
    ws9.getRow(4).height = 24;

    const prThRow = ws9.getRow(5);
    prThRow.values = [
      "Langara Strategic Priority",
      "Mapped Benefit Drivers",
      "Total Points",
      "Average Score (/ 5.0)",
      "Realization %"
    ];
    prThRow.height = 24;
    prThRow.eachCell((c) => {
      c.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: "0F172A" } };
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "F1F5F9" } };
      c.alignment = { horizontal: "center", vertical: "middle" };
      applyCellBorder(c);
    });
    prThRow.getCell(1).alignment = { horizontal: "left", vertical: "middle", indent: 1 };

    const drivers = data.scorecard || [];
    const calcPriorityGroup = (prioName, fallbackIds, fallbackTot, fallbackAvg) => {
      const matched = drivers.filter(
        (d) => (d.strategicPriority || "").toLowerCase() === prioName.toLowerCase()
      );
      if (matched.length > 0) {
        const tot = matched.reduce((acc, d) => acc + (Number(d.score) || 0), 0);
        const avg = tot / matched.length;
        return {
          priority: prioName,
          driversText: `${matched.map((m) => m.driverId).join(", ")} (${matched.length} benefits)`,
          totalText: `${tot.toFixed(1)} / ${(matched.length * 5).toFixed(1)}`,
          avgText: `${avg.toFixed(1)} / 5.0`,
          pctText: `${Math.round((avg / 5.0) * 100)}%`
        };
      }
      return {
        priority: prioName,
        driversText: `${fallbackIds.join(", ")} (${fallbackIds.length} benefits)`,
        totalText: `${fallbackTot.toFixed(1)} / ${(fallbackIds.length * 5).toFixed(1)}`,
        avgText: `${fallbackAvg.toFixed(1)} / 5.0`,
        pctText: `${Math.round((fallbackAvg / 5.0) * 100)}%`
      };
    };

    const priorityRollups = [
      calcPriorityGroup("Human Capacity", ["B1", "B4", "B6", "B8"], 16.0, 4.0),
      calcPriorityGroup("Technology Utilization", ["B2", "B5", "B7"], 11.4, 3.8),
      calcPriorityGroup("Campus Development", ["B3", "B9"], 7.9, 4.0)
    ];

    priorityRollups.forEach((pr, idx) => {
      const rNum = 6 + idx;
      const row = ws9.getRow(rNum);
      row.values = [pr.priority, pr.driversText, pr.totalText, pr.avgText, pr.pctText];
      row.height = 23;
      row.eachCell((c) => {
        c.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: idx % 2 === 1 ? "F8FAFC" : "FFFFFF" }
        };
        c.font = { name: "Segoe UI", size: 9.5, color: { argb: "0F172A" } };
        applyCellBorder(c);
      });
      row.getCell(1).alignment = { vertical: "middle", indent: 1 };
      row.getCell(1).font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: "0F172A" } };
      row.getCell(2).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(3).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(4).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(4).font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: "F15A22" } };
      row.getCell(5).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(5).font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: "1E824C" } };
    });

    // Detailed Benefits Map Table
    ws9.mergeCells("A10:E10");
    const mapHead = ws9.getCell("A10");
    mapHead.value = "2. DETAILED BENEFITS MAP — STRATEGIC PRIORITY ALIGNMENT & MEASURABLE KPIS";
    mapHead.font = { name: "Segoe UI", size: 10.5, bold: true, color: { argb: "FFFFFF" } };
    mapHead.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "0F172A" } };
    mapHead.alignment = { vertical: "middle", indent: 1 };
    ws9.getRow(10).height = 24;

    const mapThRow = ws9.getRow(11);
    mapThRow.values = [
      "Supports Strategic Priority of:",
      "Benefit ID & Name",
      "PRM Score",
      "Measurable KPIs",
      "Operational Verification Evidence"
    ];
    mapThRow.height = 24;
    mapThRow.eachCell((c) => {
      c.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: "0F172A" } };
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "F1F5F9" } };
      c.alignment = { horizontal: "center", vertical: "middle" };
      applyCellBorder(c);
    });
    mapThRow.getCell(1).alignment = { horizontal: "left", vertical: "middle", indent: 1 };
    mapThRow.getCell(2).alignment = { horizontal: "left", vertical: "middle", indent: 1 };
    mapThRow.getCell(4).alignment = { horizontal: "left", vertical: "middle", indent: 1 };
    mapThRow.getCell(5).alignment = { horizontal: "left", vertical: "middle", indent: 1 };

    const defaultMapOrder = ["B1", "B4", "B6", "B8", "B2", "B5", "B7", "B3", "B9"];
    const orderedDrivers = defaultMapOrder
      .map((id) => drivers.find((d) => d.driverId === id))
      .filter(Boolean);

    orderedDrivers.forEach((d, idx) => {
      const rNum = 12 + idx;
      const row = ws9.getRow(rNum);
      row.values = [
        d.strategicPriority || "Human Capacity",
        `${d.driverId} ${d.name}`,
        (Number(d.score) || 0).toFixed(1),
        d.measurableKpis || "",
        d.evidence || ""
      ];
      row.height = 28;
      row.eachCell((c) => {
        c.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: idx % 2 === 1 ? "F8FAFC" : "FFFFFF" }
        };
        c.font = { name: "Segoe UI", size: 9.5, color: { argb: "0F172A" } };
        applyCellBorder(c);
      });
      row.getCell(1).alignment = { vertical: "middle", indent: 1 };
      row.getCell(1).font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: "0F172A" } };
      row.getCell(2).alignment = { vertical: "middle", indent: 1 };
      row.getCell(2).font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: "0F172A" } };
      row.getCell(3).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(3).font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "F15A22" } };
      row.getCell(4).alignment = { vertical: "middle", indent: 1, wrapText: true };
      row.getCell(5).alignment = { vertical: "middle", indent: 1, wrapText: true };
    });

    ws9.columns = [{ width: 28 }, { width: 38 }, { width: 16 }, { width: 52 }, { width: 52 }];

    const buffer = await wb.xlsx.writeBuffer();

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${data.orgName.replace(/\s+/g, "_")}_Benefits_Realization_Scorecard.xlsx"`
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    return res.send(Buffer.from(buffer));
  } catch (error) {
    console.error("[BENEFITS EXPORT ERROR]", error);
    return res.status(500).json({ message: "Failed to export Excel report", error: error.message });
  }
};

/**
 * Helper: Safely escape XML characters
 */
const escapeXml = (str) =>
  (str || "")
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

/**
 * @desc    Export dynamic 11-slide PowerPoint presentation (.pptx) injected with live MongoDB values
 * @route   GET /api/v1/benefits/export-pptx
 * @access  Private (flexibleProtect)
 */
export const exportBenefitsPptx = async (req, res) => {
  try {
    const orgQuery = req.query.orgName || req.user?.orgName || "Langara College";
    const deckType = (req.query.type || "prm").toString().toLowerCase();
    const data = await findBenefitsDoc(orgQuery, true);

    if (!data) {
      return res.status(404).json({ message: "Benefits realization data not found" });
    }

    const overallScore = (Number(data.overallScore) || 3.9).toFixed(1);
    const targetScore = (Number(data.targetScore) || 5.0).toFixed(1);
    const realizationPct = Math.round(Number(data.realizationPercentage) || 78);

    // If type=program, export the 2-slide Program Benefits Roll-up Dashboard PPTX
    if (deckType === "program") {
      const progTemplatePath = path.resolve(
        __dirname,
        "../templates/Langara_Program_Benefits_Template.pptx"
      );
      if (!fs.existsSync(progTemplatePath)) {
        return res.status(500).json({ message: "Program Benefits template not found on server" });
      }
      const progBuffer = fs.readFileSync(progTemplatePath);
      const progZip = await JSZip.loadAsync(progBuffer);

      // Slide 1 of Program Benefits Dashboard: Dynamic Reporting Date, Rollout Progress & Budget
      let progSlide1 = await progZip.file("ppt/slides/slide1.xml")?.async("string");
      if (progSlide1 && data.programRollup) {
        const pr = data.programRollup;
        if (pr.reportingDate) {
          progSlide1 = progSlide1.replace("November 27, 2026", escapeXml(pr.reportingDate));
        }
        if (pr.approxTeamsRemaining !== undefined) {
          progSlide1 = progSlide1.replace(
            "&lt;20&gt;",
            `&lt;${escapeXml(pr.approxTeamsRemaining)}&gt;`
          );
        }
        if (pr.startDate) {
          progSlide1 = progSlide1.replace("Apr 1, 2025", escapeXml(pr.startDate));
        }
        if (pr.endDate) {
          progSlide1 = progSlide1.replace("Jan 31, 2028", escapeXml(pr.endDate));
        }
        progZip.file("ppt/slides/slide1.xml", progSlide1);
      }

      let progSlide2 = await progZip.file("ppt/slides/slide2.xml")?.async("string");
      if (progSlide2) {
        progSlide2 = progSlide2
          .replace(
            /Mean Score: 3\.9 \/ 5\.0/g,
            `Mean Score: ${escapeXml(overallScore)} / ${escapeXml(targetScore)}`
          )
          .replace(/<a:t>78% INDEX<\/a:t>/g, `<a:t>${realizationPct}% INDEX</a:t>`);

        const templateDrivers = [
          {
            id: "B1",
            score: "4.2",
            status: "On Track",
            ev: "227 active cloud files; 4.5/5 version control survey, 40.2% ROT reduction (2,175 ➔ 1,300 files)."
          },
          {
            id: "B2",
            score: "3.8",
            status: "Monitor",
            ev: "4.5/5 restricted access confidence; 0 'Everyone' grants; 0% Purview labels (205 files unlabelled)."
          },
          {
            id: "B3",
            score: "4.0",
            status: "On Track",
            ev: "4.5/5 support awareness; 15.1% storage reduction (3.90 ➔ 3.31 GB); 0 path length errors."
          },
          {
            id: "B4",
            score: "3.6",
            status: "Monitor",
            ev: "3.5/5 off-site work ease; OneDrive sync coaching required to replace manual file uploads."
          },
          {
            id: "B5",
            score: "4.1",
            status: "On Track",
            ev: "Single source of truth; folder depth 8 ➔ 2 (-75%), folders 541 ➔ 44 (-91.9%), duplicate files -58.1%."
          },
          {
            id: "B6",
            score: "3.7",
            status: "Progressing",
            ev: "4.0/5 collaboration ease; workflow transition underway across PRM libraries."
          },
          {
            id: "B7",
            score: "3.5",
            status: "On Track",
            ev: "5.0/5 metadata confidence; generic filenames reduced 347 ➔ 41 (-88.2%)."
          },
          {
            id: "B8",
            score: "4.5",
            status: "On Track",
            ev: "4.5/5 training satisfaction, 4.5/5 team responsiveness; 100% staff training completion (1,151 staff)."
          },
          {
            id: "B9",
            score: "3.9",
            status: "Dollar Savings ",
            ev: "15.1% storage reduction (3.90 ➔ 3.31 GB)"
          }
        ];

        if (Array.isArray(data.scorecard)) {
          templateDrivers.forEach((td) => {
            const liveDriver = data.scorecard.find((d) => d.driverId === td.id);
            if (liveDriver) {
              const liveScore = (Number(liveDriver.score) || Number(td.score)).toFixed(1);
              if (liveDriver.evidence && liveDriver.evidence !== td.ev) {
                progSlide2 = progSlide2.replace(escapeXml(td.ev), escapeXml(liveDriver.evidence));
                progSlide2 = progSlide2.replace(td.ev, escapeXml(liveDriver.evidence));
              }
              const idTag = `<a:t>${td.id}</a:t>`;
              const idPos = progSlide2.indexOf(idTag);
              if (idPos !== -1) {
                const nextRowPos = progSlide2.indexOf("</a:tr>", idPos);
                if (nextRowPos !== -1) {
                  let rowXml = progSlide2.substring(idPos, nextRowPos);
                  rowXml = rowXml.replace(
                    `<a:t>${td.score}</a:t>`,
                    `<a:t>${escapeXml(liveScore)}</a:t>`
                  );
                  if (td.id !== "B9" && liveDriver.status) {
                    rowXml = rowXml.replace(
                      `<a:t>${td.status}</a:t>`,
                      `<a:t>${escapeXml(liveDriver.status)}</a:t>`
                    );
                  }
                  progSlide2 =
                    progSlide2.substring(0, idPos) + rowXml + progSlide2.substring(nextRowPos);
                }
              }
            }
          });
        }

        const meanPos = progSlide2.indexOf("<a:t>MEAN</a:t>");
        if (meanPos !== -1) {
          const endMeanRow = progSlide2.indexOf("</a:tr>", meanPos);
          if (endMeanRow !== -1) {
            let meanRowXml = progSlide2.substring(meanPos, endMeanRow);
            meanRowXml = meanRowXml.replace(
              "<a:t>3.9</a:t>",
              `<a:t>${escapeXml(overallScore)}</a:t>`
            );
            progSlide2 =
              progSlide2.substring(0, meanPos) + meanRowXml + progSlide2.substring(endMeanRow);
          }
        }
        progZip.file("ppt/slides/slide2.xml", progSlide2);
      }

      const progOut = await progZip.generateAsync({
        type: "nodebuffer",
        compression: "DEFLATE",
        compressionOptions: { level: 6 }
      });

      const safeOrg = (data.orgName || "Langara_LCP").replace(/\s+/g, "_");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${safeOrg}_Program_Benefits_Dashboard.pptx"`
      );
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation"
      );
      return res.send(progOut);
    }

    const templatePath = path.resolve(__dirname, "../templates/Langara_PRM_Master_Template.pptx");
    if (!fs.existsSync(templatePath)) {
      return res.status(500).json({ message: "Master PowerPoint template not found on server" });
    }

    const templateBuffer = fs.readFileSync(templatePath);
    const zip = await JSZip.loadAsync(templateBuffer);

    // 1. SLIDE 4: Executive Realization Dashboard (Overall Score, 4 Pillars, Outcomes)
    let slide4Xml = await zip.file("ppt/slides/slide4.xml")?.async("string");
    if (slide4Xml) {
      slide4Xml = slide4Xml
        .replace(/<a:t>3\.9<\/a:t>/g, `<a:t>${escapeXml(overallScore)}</a:t>`)
        .replace(
          /<a:t>\/ 5\.0 \(78%\)<\/a:t>/g,
          `<a:t>/ ${escapeXml(targetScore)} (${realizationPct}%)</a:t>`
        );

      // Update 4 Pillars statuses if modified in DB
      if (Array.isArray(data.pillars)) {
        const deliv = data.pillars.find((p) => p.name?.toLowerCase().includes("delivery"));
        const adopt = data.pillars.find((p) => p.name?.toLowerCase().includes("adoption"));
        const benef = data.pillars.find((p) => p.name?.toLowerCase().includes("benefit"));
        const risk = data.pillars.find((p) => p.name?.toLowerCase().includes("risk"));

        if (benef?.status) {
          slide4Xml = slide4Xml.replace(
            /<a:t>Progressing<\/a:t>/,
            `<a:t>${escapeXml(benef.status)}</a:t>`
          );
        }
        if (risk?.status) {
          slide4Xml = slide4Xml.replace(
            /<a:t>Monitor<\/a:t>/,
            `<a:t>${escapeXml(risk.status)}</a:t>`
          );
        }
        if (deliv?.status && deliv.status !== "On Track") {
          slide4Xml = slide4Xml.replace(
            /<a:t>On Track<\/a:t>/,
            `<a:t>${escapeXml(deliv.status)}</a:t>`
          );
        }
        if (adopt?.status && adopt.status !== "On Track") {
          // Replace second occurrence if adoption changed
          let count = 0;
          slide4Xml = slide4Xml.replace(/<a:t>On Track<\/a:t>/g, (match) => {
            count++;
            return count === 2 ? `<a:t>${escapeXml(adopt.status)}</a:t>` : match;
          });
        }
      }

      // Update Outcomes if modified in DB
      if (data.outcomes?.folderCount) {
        const fc = data.outcomes.folderCount;
        const pct = Math.abs(Number(fc.percentChange) || 91.9).toFixed(1);
        slide4Xml = slide4Xml
          .replace(/•  91\.9% Fewer Folders/g, `•  ${pct}% Fewer Folders`)
          .replace(/541 reduced to 44/g, `${fc.baseline ?? 541} reduced to ${fc.current ?? 44}`);
      }
      if (data.outcomes?.duplicateFiles) {
        const df = data.outcomes.duplicateFiles;
        const pct = Math.abs(Number(df.percentChange) || 58.1).toFixed(1);
        slide4Xml = slide4Xml
          .replace(/•  58\.1% Fewer Duplicate Files/g, `•  ${pct}% Fewer Duplicate Files`)
          .replace(/117 reduced to 49/g, `${df.baseline ?? 117} reduced to ${df.current ?? 49}`)
          .replace(/117  ➔  49/g, `${df.baseline ?? 117}  ➔  ${df.current ?? 49}`)
          .replace(/-58\.1%/g, `-${pct}%`);
      }
      if (data.outcomes?.genericNames) {
        const gn = data.outcomes.genericNames;
        const pct = Math.abs(Number(gn.percentChange) || 88.2).toFixed(1);
        slide4Xml = slide4Xml
          .replace(/347  ➔  41/g, `${gn.baseline ?? 347}  ➔  ${gn.current ?? 41}`)
          .replace(/-88\.2%/g, `-${pct}%`);
      }

      zip.file("ppt/slides/slide4.xml", slide4Xml);
    }

    // 2. SLIDE 5: Strategic Benefits Scorecard Table (Drivers B1 - B9 + Mean Row)
    let slide5Xml = await zip.file("ppt/slides/slide5.xml")?.async("string");
    if (slide5Xml) {
      slide5Xml = slide5Xml
        .replace(
          /Mean Score: 3\.9 \/ 5\.0/g,
          `Mean Score: ${escapeXml(overallScore)} / ${escapeXml(targetScore)}`
        )
        .replace(/<a:t>78% INDEX<\/a:t>/g, `<a:t>${realizationPct}% INDEX</a:t>`);

      // Original baseline driver map from template
      const templateDrivers = [
        {
          id: "B1",
          score: "4.2",
          status: "On Track",
          ev: "227 active cloud files; 4.5/5 version control survey, 40.2% ROT reduction (2,175 ➔ 1,300 files)."
        },
        {
          id: "B2",
          score: "3.8",
          status: "Monitor",
          ev: "4.5/5 restricted access confidence; 0 'Everyone' grants; 0% Purview labels (205 files unlabelled)."
        },
        {
          id: "B3",
          score: "4.0",
          status: "On Track",
          ev: "4.5/5 support awareness; 15.1% storage reduction (3.90 ➔ 3.31 GB); 0 path length errors."
        },
        {
          id: "B4",
          score: "3.6",
          status: "Monitor",
          ev: "3.5/5 off-site work ease; OneDrive sync coaching required to replace manual file uploads."
        },
        {
          id: "B5",
          score: "4.1",
          status: "On Track",
          ev: "Single source of truth; folder depth 8 ➔ 2 (-75%), folders 541 ➔ 44 (-91.9%), duplicate files -58.1%."
        },
        {
          id: "B6",
          score: "3.7",
          status: "Progressing",
          ev: "4.0/5 collaboration ease; workflow transition underway across PRM libraries."
        },
        {
          id: "B7",
          score: "3.5",
          status: "On Track",
          ev: "5.0/5 metadata confidence; generic filenames reduced 347 ➔ 41 (-88.2%)."
        },
        {
          id: "B8",
          score: "4.5",
          status: "On Track",
          ev: "4.5/5 training satisfaction, 4.5/5 team responsiveness; 100% staff training completion (1,151 staff)."
        },
        {
          id: "B9",
          score: "3.9",
          status: "Dollar Savings ",
          ev: "15.1% storage reduction (3.90 ➔ 3.31 GB)"
        }
      ];

      if (Array.isArray(data.scorecard)) {
        templateDrivers.forEach((td) => {
          const liveDriver = data.scorecard.find((d) => d.driverId === td.id);
          if (liveDriver) {
            const liveScore = (Number(liveDriver.score) || Number(td.score)).toFixed(1);
            if (liveDriver.evidence && liveDriver.evidence !== td.ev) {
              slide5Xml = slide5Xml.replace(escapeXml(td.ev), escapeXml(liveDriver.evidence));
              slide5Xml = slide5Xml.replace(td.ev, escapeXml(liveDriver.evidence));
            }
            // Match driver cell row context in XML
            const idTag = `<a:t>${td.id}</a:t>`;
            const idPos = slide5Xml.indexOf(idTag);
            if (idPos !== -1) {
              const nextRowPos = slide5Xml.indexOf("</a:tr>", idPos);
              if (nextRowPos !== -1) {
                let rowXml = slide5Xml.substring(idPos, nextRowPos);
                rowXml = rowXml.replace(
                  `<a:t>${td.score}</a:t>`,
                  `<a:t>${escapeXml(liveScore)}</a:t>`
                );
                if (td.id !== "B9" && liveDriver.status) {
                  rowXml = rowXml.replace(
                    `<a:t>${td.status}</a:t>`,
                    `<a:t>${escapeXml(liveDriver.status)}</a:t>`
                  );
                }
                slide5Xml =
                  slide5Xml.substring(0, idPos) + rowXml + slide5Xml.substring(nextRowPos);
              }
            }
          }
        });
      }

      // Update MEAN row score
      const meanPos = slide5Xml.indexOf("<a:t>MEAN</a:t>");
      if (meanPos !== -1) {
        const endMeanRow = slide5Xml.indexOf("</a:tr>", meanPos);
        if (endMeanRow !== -1) {
          let meanRowXml = slide5Xml.substring(meanPos, endMeanRow);
          meanRowXml = meanRowXml.replace(
            "<a:t>3.9</a:t>",
            `<a:t>${escapeXml(overallScore)}</a:t>`
          );
          slide5Xml =
            slide5Xml.substring(0, meanPos) + meanRowXml + slide5Xml.substring(endMeanRow);
        }
      }

      zip.file("ppt/slides/slide5.xml", slide5Xml);
    }

    // 3. SLIDE 7 & SLIDE 8: Recommendations & Needs Attention Remediation
    let slide7Xml = await zip.file("ppt/slides/slide7.xml")?.async("string");
    let slide8Xml = await zip.file("ppt/slides/slide8.xml")?.async("string");

    if (Array.isArray(data.needsAttention) && data.needsAttention.length > 0) {
      const na1 = data.needsAttention[0];
      const na2 = data.needsAttention[1];

      const origNa1Rec =
        "LCP Project 1 is piloting Purview auto-labelling and security classifications across selected PRM libraries using retain-only labels, with no automated deletion or disposition. Retention schedules are being gathered through the LCP program requirements.";
      const origNa2Rec =
        "Deliver targeted 15-minute coaching clinics on OneDrive sync vs. manual uploads.";

      if (na1?.recommendation && slide7Xml) {
        slide7Xml = slide7Xml.replace(origNa1Rec, escapeXml(na1.recommendation));
        zip.file("ppt/slides/slide7.xml", slide7Xml);
      }

      if (slide8Xml) {
        if (na1?.recommendation) {
          slide8Xml = slide8Xml.replace(origNa1Rec, escapeXml(na1.recommendation));
        }
        if (na1?.issue) {
          slide8Xml = slide8Xml.replace(
            "0% retention labels applied. 205 potentially sensitive administrative and student files remain unlabeled in SharePoint document libraries.",
            escapeXml(na1.issue)
          );
        }
        if (na2?.recommendation) {
          slide8Xml = slide8Xml.replace(origNa2Rec, escapeXml(na2.recommendation));
        }
        zip.file("ppt/slides/slide8.xml", slide8Xml);
      }
    }

    // 4. SLIDE 9: Benefit Checkpoints Roadmap — Stage-Gate Governance
    let slide9Xml = await zip.file("ppt/slides/slide9.xml")?.async("string");
    if (slide9Xml) {
      slide9Xml = slide9Xml.replace(
        /<a:t>3\.9 \/ 5\.0<\/a:t>/g,
        `<a:t>${escapeXml(overallScore)} / ${escapeXml(targetScore)}</a:t>`
      );
      zip.file("ppt/slides/slide9.xml", slide9Xml);
    }

    const outBuffer = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 6 }
    });

    const safeOrg = (data.orgName || "Langara_PRM").replace(/\s+/g, "_");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${safeOrg}_Executive_Scorecard.pptx"`
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    );
    return res.send(outBuffer);
  } catch (error) {
    console.error("[BENEFITS PPTX EXPORT ERROR]", error);
    return res
      .status(500)
      .json({ message: "Failed to export PowerPoint presentation", error: error.message });
  }
};
