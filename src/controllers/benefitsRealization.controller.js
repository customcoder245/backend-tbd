import BenefitsRealization from "../models/benefitsRealization.model.js";
import XLSX from "xlsx";

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
 * @desc    Export Benefits Realization data as Excel workbook (.xlsx)
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

    const wb = XLSX.utils.book_new();

    // Sheet 1: Executive Overview
    const overviewData = [
      ["PROGRAM OVERVIEW", ""],
      ["Organization", data.orgName],
      ["Program Name", data.programName],
      ["Project ID", data.pid],
      ["Wave Scope", data.waveName],
      ["Active Program Score", `${data.overallScore} / ${data.targetScore}`],
      ["Realization Index", `${data.realizationPercentage}%`],
      ["Active Review Gate", `Checkpoint ${data.activeCheckpointNumber}`],
      ["Strategic Statement", data.strategicAlignmentStatement],
      [],
      ["STRATEGIC PILLARS", "STATUS", "SCORE", "SUMMARY"],
      ...data.pillars.map((p) => [p.name, p.status, p.score, p.summary])
    ];
    const wsOverview = XLSX.utils.aoa_to_sheet(overviewData);
    XLSX.utils.book_append_sheet(wb, wsOverview, "Overview");

    // Sheet 2: Benefits Scorecard (B1 - B9)
    const scorecardData = [
      ["Driver ID", "Strategic Driver Name", "Target Score", "Current Score", "Status", "Evidence / Operational Metric"],
      ...data.scorecard.map((s) => [s.driverId, s.name, s.target, s.score, s.status, s.evidence])
    ];
    const wsScorecard = XLSX.utils.aoa_to_sheet(scorecardData);
    XLSX.utils.book_append_sheet(wb, wsScorecard, "Benefits Scorecard");

    // Sheet 3: Stage-Gate Checkpoints
    const checkpointData = [
      ["Checkpoint #", "Review Phase Name", "Target Review Date", "Provisional Score", "Stage Status", "Notes"],
      ...data.checkpoints.map((cp) => [cp.checkpointNumber, cp.name, cp.targetDate, cp.score, cp.status, cp.notes])
    ];
    const wsCheckpoints = XLSX.utils.aoa_to_sheet(checkpointData);
    XLSX.utils.book_append_sheet(wb, wsCheckpoints, "Checkpoints");

    // Sheet 4: Operational Outcomes & Hygiene
    const outcomesData = [
      ["Metric Dimension", "Baseline", "Post-Go-Live Current", "Percentage Improvement", "Operational Status"],
      ["Folder Architecture (Total Folders)", data.outcomes.folderCount.baseline, data.outcomes.folderCount.current, `${data.outcomes.folderCount.percentChange}%`, "Simpler & Flatter Structure"],
      ["Duplicate File Hygiene", data.outcomes.duplicateFiles.baseline, data.outcomes.duplicateFiles.current, `${data.outcomes.duplicateFiles.percentChange}%`, "Reduced Redundancy"],
      ["Generic / Ambiguous Filenames", data.outcomes.genericNames.baseline, data.outcomes.genericNames.current, `${data.outcomes.genericNames.percentChange}%`, "Better Search Findability"],
      ["Everyone Access Grants", 0, data.outcomes.everyoneGrants, "0 grants", "Governance Enforced"],
      ["Folder-Level Security Exceptions", 0, data.outcomes.folderExceptions, "0 exceptions", "Clean Permission Inheritance"],
      ["Staff Training Completion", "-", `${data.outcomes.trainedStaff} / ${data.outcomes.totalStaff}`, "100%", "Full Staff Adoption"],
      ["Active Collaboration Files in Cloud", "-", data.outcomes.activeFiles, "-", "Active Co-authoring Live"]
    ];
    const wsOutcomes = XLSX.utils.aoa_to_sheet(outcomesData);
    XLSX.utils.book_append_sheet(wb, wsOutcomes, "Hygiene & Outcomes");

    // Sheet 5: Needs Attention Actions
    const needsAttentionData = [
      ["Action ID", "Focus Category", "Severity Level", "Security Health Status", "Issue Description", "Business Impact", "Prescribed Recommendation"],
      ...data.needsAttention.map((na) => [na.id, na.category, na.severity, na.healthStatus, na.issue, na.impact, na.recommendation])
    ];
    const wsNeedsAttention = XLSX.utils.aoa_to_sheet(needsAttentionData);
    XLSX.utils.book_append_sheet(wb, wsNeedsAttention, "Needs Attention");

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    res.setHeader("Content-Disposition", `attachment; filename="${data.orgName.replace(/\s+/g, '_')}_Benefits_Realization_Scorecard.xlsx"`);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    return res.send(buf);
  } catch (error) {
    console.error("[BENEFITS EXPORT ERROR]", error);
    return res.status(500).json({ message: "Failed to export Excel report", error: error.message });
  }
};
