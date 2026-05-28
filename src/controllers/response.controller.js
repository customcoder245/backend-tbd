import Response from "../models/response.model.js";
import Question from "../models/question.model.js";
import ExcelJS from "exceljs";


/**
 * SAVE RESPONSE (Autosave) - Optimized with batch fetching
 */
export const saveResponse = async (req, res) => {
  try {
    const responses = req.body.responses;

    if (!Array.isArray(responses) || responses.length === 0) {
      return res.status(400).json({ message: "Invalid response data" });
    }

    // Batch fetch all questions at once instead of one-by-one
    const questionIds = [...new Set(responses.map(r => r.questionId))];
    const questions = await Question.find({ _id: { $in: questionIds } }).lean();
    const questionMap = {};
    questions.forEach(q => { questionMap[q._id.toString()] = q; });

    const bulkOps = [];
    for (let response of responses) {
      const { assessmentId, questionId, questionCode, answer, comment } = response;

      if (!assessmentId || !questionId || !questionCode || answer === undefined) {
        return res.status(400).json({ message: "Invalid response data" });
      }

      const question = questionMap[questionId.toString()];
      if (!question) {
        return res.status(404).json({ message: `Question ${questionId} not found` });
      }

      let finalComment = comment;

      if (question.scale === "SCALE_1_5" || question.questionType === "Calibration") {
        if (answer <= 2 && !comment?.trim()) {
          return res.status(400).json({ message: "Comment is required for 'Never' or 'Rarely' answers." });
        } else if (answer > 2) {
          finalComment = null;
        }
      }
      else if (question.scale === "FORCED_CHOICE") {
        if (!comment?.trim()) {
          return res.status(400).json({
            message: `Comment is required for chosen option`
          });
        }
      }

      const fullResponseData = {
        assessmentId,
        questionId: question._id,
        questionCode: question.questionCode,
        questionStem: question.questionStem,
        stakeholder: question.stakeholder,
        domain: question.domain,
        subdomain: question.subdomain,
        questionType: question.questionType,
        scale: question.scale,
        value: typeof answer === "number" ? answer : null,
        selectedOption: typeof answer === "string" ? answer : null,
        higherValueOption: question.forcedChoice?.higherValueOption || null,
        valueDirection: question.forcedChoice?.higherValueOption
          ? answer === question.forcedChoice.higherValueOption
            ? "HIGHER"
            : "LOWER"
          : null,
        comment: finalComment,
        insightPrompt: (question.scale === "FORCED_CHOICE" && question.forcedChoice)
          ? (answer === "A" ? question.forcedChoice.optionA?.insightPrompt : question.forcedChoice.optionB?.insightPrompt) || question.insightPrompt
          : question.insightPrompt,
        subdomainWeight: question.subdomainWeight
      };

      bulkOps.push({
        updateOne: {
          filter: { assessmentId, questionId },
          update: { $set: fullResponseData },
          upsert: true
        }
      });
    }

    if (bulkOps.length > 0) {
      await Response.bulkWrite(bulkOps);
    }

    // Return the saved docs
    const assessmentIds = [...new Set(responses.map(r => r.assessmentId))];
    const savedResponses = await Response.find({
      assessmentId: { $in: assessmentIds },
      questionId: { $in: questionIds }
    }).lean();

    res.status(200).json(savedResponses);
  } catch (error) {
    res.status(500).json({
      message: "Error saving responses",
      error: error.message
    });
  }
};


/**
 * GET RESPONSES BY ASSESSMENT
 */
export const getResponsesByAssessment = async (req, res) => {
  try {
    const { assessmentId } = req.params;

    if (!assessmentId) {
      return res.status(400).json({ message: "Assessment ID is required" });
    }

    // --- NEW LOGIC: Fetch from SubmittedAssessment snapshot first ---
    const SubmittedAssessment = (await import("../models/submittedAssessment.model.js")).default;
    const submitted = await SubmittedAssessment.findOne({ assessmentId });

    if (submitted) {
      console.log(`[ResponseController] Returning snapshotted data from SubmittedAssessment for ${assessmentId}`);
      return res.status(200).json(submitted);
    }

    // Fallback to real-time Response collection (drafts or legacy)
    const responses = await Response.find({ assessmentId });

    if (!responses.length) {
      return res.status(404).json({ message: "No responses found for this assessment" });
    }

    res.status(200).json({ responses });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching responses",
      error: error.message
    });
  }
};

/**
 * EXPORT INDIVIDUAL REPORT TO EXCEL
 */
export const exportIndividualReportExcel = async (req, res) => {
  try {
    const { assessmentId } = req.params;

    // 1. Fetch submitted assessment or current draft details
    const SubmittedAssessment = (await import("../models/submittedAssessment.model.js")).default;
    const Assessment = (await import("../models/assessment.model.js")).default;
    const ResponseModel = (await import("../models/response.model.js")).default;

    let responses = [];
    let userDetails = {};
    let scores = {};
    let submittedAt = new Date();
    let stakeholder = "employee";

    const submitted = await SubmittedAssessment.findOne({ assessmentId });
    if (submitted) {
      responses = submitted.responses || [];
      userDetails = submitted.userDetails || {};
      scores = submitted.scores || {};
      submittedAt = submitted.submittedAt || submitted.createdAt || new Date();
      stakeholder = submitted.stakeholder || "employee";
    } else {
      const assessment = await Assessment.findById(assessmentId);
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }
      const rawResponses = await ResponseModel.find({ assessmentId });
      responses = rawResponses.map(r => r.toObject());
      userDetails = assessment.userDetails || {};
      scores = assessment.scores || {};
      submittedAt = assessment.submittedAt || assessment.createdAt || new Date();
      stakeholder = assessment.stakeholder || "employee";
    }

    // 2. Format details
    const empName = userDetails.firstName ? `${userDetails.firstName} ${userDetails.lastName || ""}`.trim() : "Participant";
    const empDept = userDetails.department || "N/A";
    const empRole = userDetails.role || "N/A";
    const completedDate = new Date(submittedAt).toLocaleDateString("en-US", {
      day: "2-digit", month: "short", year: "numeric"
    });
    const assessmentName = stakeholder
      ? `${stakeholder.charAt(0).toUpperCase() + stakeholder.slice(1)} Assessment`
      : "POD-360 Assessment";

    // 3. Setup workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "TBD Platform";
    workbook.created = new Date();

    const ws = workbook.addWorksheet("Response Report", {
      views: [{ showGridLines: true, zoomScale: 90 }],
      pageSetup: { paperSize: 9, orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
    });

    // Column widths (9 cols: A-I)
    ws.columns = [
      { key: "col1", width: 26 },   // A  Domain
      { key: "col2", width: 28 },   // B  Subdomain
      { key: "col3", width: 16 },   // C  Question Code
      { key: "col4", width: 62 },   // D  Question
      { key: "col5", width: 18 },   // E  Question Type
      { key: "col6", width: 13 },   // F  Your Score
      { key: "col7", width: 13 },   // G  Max Score
      { key: "col8", width: 13 },   // H  % Score
      { key: "col9", width: 42 },   // I  Comments
    ];

    // ── Colour palette ───────────────────────────────────────────────────────
    const C = {
      navy: "FF0F2547",
      navyLight: "FF1A3A6B",
      white: "FFFFFFFF",
      offWhite: "FFF8FAFC",
      lightGrey: "FFE8EDF4",
      midGrey: "FFD0D8E4",
      darkText: "FF1E2A3B",
      mutedText: "FF6B7A90",
      altRow: "FFF4F6FA",

      // Domain themes
      blue1: "FFE8F0FE", blue2: "FF1A56DB", blue3: "FF1E3A8A",
      green1: "FFE6F9EE", green2: "FF0E9F6E", green3: "FF065F46",
      purple1: "FFF5F0FF", purple2: "FF7C3AED", purple3: "FF4C1D95",

      // Score colours  1=red, 2=orange, 3=amber, 4=green, 5=dark green
      s1bg: "FFFEE2E2", s1fg: "FFDC2626",
      s2bg: "FFFEF0E0", s2fg: "FFEA580C",
      s3bg: "FFFEF9C3", s3fg: "FFB45309",
      s4bg: "FFE6F9EE", s4fg: "FF059669",
      s5bg: "FFD1FAE5", s5fg: "FF047857",
    };

    // ── Helper factories ─────────────────────────────────────────────────────
    const mkFill = (argb) => ({ type: "pattern", pattern: "solid", fgColor: { argb } });
    const mkFont = (argb, sz, bold = false) => ({ name: "Segoe UI", size: sz, bold, color: { argb } });
    const mkAlign = (h, v = "middle", wrap = false) => ({ horizontal: h, vertical: v, wrapText: wrap });
    const mkBorder = (clr = "FFD0D8E4", style = "thin") => ({
      top: { style, color: { argb: clr } },
      left: { style, color: { argb: clr } },
      bottom: { style, color: { argb: clr } },
      right: { style, color: { argb: clr } },
    });

    const applyCell = (cell, opts = {}) => {
      if (opts.value !== undefined) cell.value = opts.value;
      if (opts.fill) cell.fill = mkFill(opts.fill);
      if (opts.font) cell.font = opts.font;
      if (opts.align) cell.alignment = opts.align;
      if (opts.border) cell.border = opts.border;
    };

    const getDomainTheme = (name = "") => {
      const n = name.toLowerCase();
      if (n.includes("people") || n.includes("potential"))
        return { bg: C.blue1, accent: C.blue2, text: C.blue3 };
      if (n.includes("operation") || n.includes("leader") || n.includes("steady") || n.includes("effect"))
        return { bg: C.green1, accent: C.green2, text: C.green3 };
      return { bg: C.purple1, accent: C.purple2, text: C.purple3 };
    };

    const getScorePalette = (val) => {
      const map = {
        1: { bg: C.s1bg, fg: C.s1fg },
        2: { bg: C.s2bg, fg: C.s2fg },
        3: { bg: C.s3bg, fg: C.s3fg },
        4: { bg: C.s4bg, fg: C.s4fg },
        5: { bg: C.s5bg, fg: C.s5fg },
      };
      return map[Math.round(val)] || { bg: C.offWhite, fg: C.darkText };
    };

    const mergeCells = (r1, c1, r2, c2) => {
      if (r2 > r1 || c2 > c1) ws.mergeCells(r1, c1, r2, c2);
    };

    const setHeight = (rowNum, pts) => { ws.getRow(rowNum).height = pts; };

    const thinBorder = mkBorder();
    const medBorder = mkBorder("FFAAB8CC", "medium");

    // ════════════════════════════════════════════════════════════════════════
    // SECTION 1 - TITLE BANNER  (rows 1-3)
    // ════════════════════════════════════════════════════════════════════════

    // ════════════════════════════════════════════════════════════════
    // PREMIUM HEADER SECTION
    // ════════════════════════════════════════════════════════════════

    // ===== TOP HEADER CONTAINER =====

    // Main left title card
    mergeCells(1, 1, 3, 5);

    applyCell(ws.getCell(1, 1), {
      value: "INDIVIDUAL RESPONSE REPORT",
      fill: C.navy,
      font: {
        name: "Segoe UI",
        size: 20,
        bold: true,
        color: { argb: C.white }
      },
      align: {
        horizontal: "left",
        vertical: "middle",
        indent: 1
      },
      border: {
        top: { style: "medium", color: { argb: "FFD4AF37" } },
        left: { style: "medium", color: { argb: "FFD4AF37" } },
        bottom: { style: "medium", color: { argb: "FFD4AF37" } },
        right: { style: "medium", color: { argb: "FFD4AF37" } },
      }
    });

    // Premium golden top line
    for (let c = 1; c <= 5; c++) {
      applyCell(ws.getCell(1, c), {
        border: {
          top: { style: "thick", color: { argb: "FFD4AF37" } }
        }
      });
    }

    // Subtitle strip
    mergeCells(4, 1, 4, 5);

    applyCell(ws.getCell(4, 1), {
      value: "Detailed response analysis by domain, sub-domain and question performance",
      fill: C.navyLight,
      font: {
        name: "Segoe UI",
        size: 9,
        bold: false,
        color: { argb: C.white }
      },
      align: {
        horizontal: "left",
        vertical: "middle",
        indent: 1
      },
      border: thinBorder
    });



    // ===== RIGHT METADATA PANEL =====

    // Background panel
    for (let r = 1; r <= 4; r++) {
      for (let c = 6; c <= 9; c++) {

        applyCell(ws.getCell(r, c), {
          fill: "FFF8FAFC",
          border: {
            top: { style: "thin", color: { argb: "FFE2E8F0" } },
            left: { style: "thin", color: { argb: "FFE2E8F0" } },
            bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
            right: { style: "thin", color: { argb: "FFE2E8F0" } },
          }
        });

      }
    }

    const metaRows = [
      ["NAME", empName],
      ["DEPARTMENT", empDept],
      ["ROLE", empRole],
      ["COMPLETED", completedDate],
    ];

    metaRows.forEach(([label, val], i) => {

      const row = i + 1;

      // Label
      mergeCells(row, 6, row, 7);

      applyCell(ws.getCell(row, 6), {
        value: label,
        fill: "FFF1F5F9",
        font: {
          name: "Segoe UI",
          size: 8,
          bold: true,
          color: { argb: C.mutedText }
        },
        align: {
          horizontal: "right",
          vertical: "middle"
        },
        border: thinBorder
      });

      // Value
      mergeCells(row, 8, row, 9);

      applyCell(ws.getCell(row, 8), {
        value: val,
        fill: C.white,
        font: {
          name: "Segoe UI",
          size: 9,
          bold: true,
          color: { argb: C.darkText }
        },
        align: {
          horizontal: "left",
          vertical: "middle",
          indent: 1
        },
        border: thinBorder
      });

    });

    // Row Heights
    setHeight(1, 24);
    setHeight(2, 24);
    setHeight(3, 24);
    setHeight(4, 18);

    // Spacer row
    setHeight(5, 8);



    // ════════════════════════════════════════════════════════════════════════
    // SECTION 2 - SPACER ROW 5
    // ════════════════════════════════════════════════════════════════════════
    setHeight(5, 10);

    // ════════════════════════════════════════════════════════════════════════
    // SECTION 3 - SUMMARY CARDS  (rows 6-9)
    // ════════════════════════════════════════════════════════════════════════
    const ratingResponses = responses.filter(r => r.value !== null && r.value !== undefined);
    const selfCount = responses.filter(r => r.questionType === "Self-Rating").length;
    const behavCount = responses.filter(r => r.questionType === "Behavioural").length;

    let overallAvgVal = 0;
    if (scores.overall && scores.overall > 0) {
      overallAvgVal = scores.overall / 20;
    } else {
      overallAvgVal = ratingResponses.length > 0
        ? ratingResponses.reduce((s, r) => s + r.value, 0) / ratingResponses.length
        : 0;
    }
    const overallAvg = overallAvgVal > 0 ? overallAvgVal.toFixed(2) : "0.00";

    // const scoreDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    // ratingResponses.forEach(r => {
    //   const v = Math.round(r.value);
    //   if (v >= 1 && v <= 5) scoreDistribution[v]++;
    // });
    const totalRated = ratingResponses.length || 1;

    // Card header
    mergeCells(6, 1, 6, 9);
    applyCell(ws.getCell(6, 1), {
      value: "ASSESSMENT SUMMARY",
      fill: C.navy,
      font: mkFont(C.white, 9, true),
      align: mkAlign("center", "middle"),
    });
    setHeight(6, 18);

    // 4 metric cards (row 7 label, row 8 value)
    const cards = [
      { cols: [1, 2], label: "Overall Avg Score", val: `${overallAvg} / 5.00` },
      { cols: [3, 4], label: "Total Questions", val: `${responses.length}` },
      {
        cols: [5, 9],
        label: "Performance Scale",
        val: "LOW | NEUTRAL | HIGH"
      },

      // { cols: [5, 6], label: "Self-Rating Questions", val: `${selfCount}` },
      // { cols: [7, 9], label: "Behavioural Questions", val: `${behavCount}` },
    ];

    cards.forEach(({ cols, label, val }) => {

      // ======================================================
      // TOP LABEL ROW
      // ======================================================

      mergeCells(7, cols[0], 7, cols[1]);

      applyCell(ws.getCell(7, cols[0]), {
        value: label,
        fill: C.offWhite,
        font: mkFont(C.mutedText, 8, true),
        align: mkAlign("center", "middle"),
        border: thinBorder,
      });

      // ======================================================
      // PERFORMANCE SCALE SPECIAL DESIGN
      // ======================================================

      if (label === "Performance Scale") {

        // LOW
        mergeCells(8, 5, 8, 6);

        applyCell(ws.getCell(8, 5), {
          value: "1-2 LOW",
          fill: "FFFEE2E2",
          font: {
            name: "Segoe UI",
            size: 9,
            bold: true,
            color: { argb: "FFDC2626" }
          },
          align: mkAlign("center", "middle"),
          border: thinBorder,
        });

        // NEUTRAL
        mergeCells(8, 7, 8, 7);

        applyCell(ws.getCell(8, 7), {
          value: "3 NEUTRAL",
          fill: "FFFEF3C7",
          font: {
            name: "Segoe UI",
            size: 9,
            bold: true,
            color: { argb: "FFD97706" }
          },
          align: mkAlign("center", "middle"),
          border: thinBorder,
        });

        // HIGH
        mergeCells(8, 8, 8, 9);

        applyCell(ws.getCell(8, 8), {
          value: "4-5 HIGH",
          fill: "FFD1FAE5",
          font: {
            name: "Segoe UI",
            size: 9,
            bold: true,
            color: { argb: "FF047857" }
          },
          align: mkAlign("center", "middle"),
          border: thinBorder,
        });

      }

      // ======================================================
      // NORMAL SUMMARY CARDS
      // ======================================================

      else {

        mergeCells(8, cols[0], 8, cols[1]);

        applyCell(ws.getCell(8, cols[0]), {
          value: val,
          fill: C.white,
          font: mkFont(C.navy, 14, true),
          align: mkAlign("center", "middle"),
          border: thinBorder,
        });

      }

    });

    // Row heights
    setHeight(7, 18);
    setHeight(8, 24);

    // Score distribution bar (row 9)
    // mergeCells(9, 1, 9, 9);
    // applyCell(ws.getCell(9, 1), {
    //   value: `Score Distribution:   1: ${scoreDistribution[1]}   |   2: ${scoreDistribution[2]}   |   3: ${scoreDistribution[3]}   |   4: ${scoreDistribution[4]}   |   5: ${scoreDistribution[5]}   (out of ${totalRated} rated questions)`,
    //   fill: C.lightGrey,
    //   font: mkFont(C.mutedText, 8, false),
    //   align: mkAlign("center", "middle"),
    //   border: thinBorder,
    // });
    // setHeight(9, 16);

    // ════════════════════════════════════════════════════════════════════════
    // SECTION 4 - SPACER ROW 10
    // ════════════════════════════════════════════════════════════════════════
    setHeight(10, 8);

    // ════════════════════════════════════════════════════════════════════════
    // SECTION 5 - TABLE HEADER  (row 11)
    // ════════════════════════════════════════════════════════════════════════
    const headers = [
      "Domain", "Sub-Domain", "Question Code", "Question",
      "Question Type", "Your Score", "Max Score", "% Score", "Comments"
    ];
    headers.forEach((h, i) => {
      const cell = ws.getCell(11, i + 1);
      applyCell(cell, {
        value: h,
        fill: C.navy,
        font: mkFont(C.white, 10, true),
        align: mkAlign(i === 3 || i === 8 ? "left" : "center", "middle"),
        border: medBorder,
      });
    });
    setHeight(11, 32);

    // ════════════════════════════════════════════════════════════════════════
    // SECTION 6 - DATA ROWS  (row 12+)
    // ════════════════════════════════════════════════════════════════════════
    const domainOrder = {
      "People Potential": 1,
      "Operational Steadiness": 2,
      "Leadership Effectiveness": 2,
      "Digital Fluency": 3,
      "Execution Excellence": 3,
    };

    const sorted = [...responses].sort((a, b) => {
      const dA = domainOrder[a.domain] || 99;
      const dB = domainOrder[b.domain] || 99;
      if (dA !== dB) return dA - dB;
      if (a.domain !== b.domain) return a.domain.localeCompare(b.domain);
      if (a.subdomain !== b.subdomain) return a.subdomain.localeCompare(b.subdomain);
      return (a.questionCode || "").localeCompare(b.questionCode || "");
    });

    const DATA_START = 12;
    let currentRow = DATA_START;

    sorted.forEach((r, idx) => {
      const theme = getDomainTheme(r.domain);
      const isFc = r.questionType === "Forced-Choice" || r.scale === "FORCED_CHOICE";
      const score = isFc ? 2.5 : ((r.value !== null && r.value !== undefined) ? Number(r.value) : null);
      const sc = score !== null ? getScorePalette(score) : null;

      // Col A - Domain
      applyCell(ws.getCell(currentRow, 1), {
        value: r.domain,
        fill: theme.bg,
        font: { name: "Segoe UI", size: 9, bold: true, color: { argb: theme.text } },
        align: mkAlign("center", "middle", true),
        border: thinBorder,
      });

      // Col B - Subdomain
      applyCell(ws.getCell(currentRow, 2), {
        value: r.subdomain,
        fill: theme.bg,
        font: { name: "Segoe UI", size: 9, bold: false, color: { argb: theme.text } },
        align: mkAlign("center", "middle", true),
        border: thinBorder,
      });

      // Col C - Question Code
      applyCell(ws.getCell(currentRow, 3), {
        value: r.questionCode || "—",
        fill: C.offWhite,
        font: mkFont(C.navy, 9, true),
        align: mkAlign("center", "middle"),
        border: thinBorder,
      });

      // Col D - Question Stem
      const isOdd = idx % 2 !== 0;
      applyCell(ws.getCell(currentRow, 4), {
        value: r.questionStem || "—",
        fill: isOdd ? C.altRow : C.white,
        font: mkFont(C.darkText, 9),
        align: mkAlign("left", "middle", true),
        border: thinBorder,
      });

      // Col E - Question Type
      applyCell(ws.getCell(currentRow, 5), {
        value: r.questionType || "—",
        fill: C.offWhite,
        font: mkFont(C.mutedText, 8, true),
        align: mkAlign("center", "middle", true),
        border: thinBorder,
      });

      // Col F - Your Score
      applyCell(ws.getCell(currentRow, 6), {
        value: isFc ? `${r.selectedOption || "—"}` : (score !== null ? score : "—"),
        fill: sc ? sc.bg : C.offWhite,
        font: sc
          ? { name: "Segoe UI", size: 11, bold: true, color: { argb: sc.fg } }
          : mkFont(C.mutedText, 9),
        align: mkAlign("center", "middle"),
        border: thinBorder,
      });

      // Col G - Max Score
      applyCell(ws.getCell(currentRow, 7), {
        value: isFc ? 5 : (score !== null ? 5 : "—"),
        fill: C.offWhite,
        font: mkFont(C.mutedText, 9),
        align: mkAlign("center", "middle"),
        border: thinBorder,
      });

      // Col H - % Score


      // Col H - % Score

      let pctVal = "—";

      if (isFc) {

        pctVal = 50;

      } else if (score !== null && score !== undefined) {

        const percentageMap = {
          1: 20,
          2: 40,
          3: 60,
          4: 80,
          5: 100
        };

        pctVal = percentageMap[Math.round(score)] || "—";
      }


      applyCell(ws.getCell(currentRow, 8), {
        value: pctVal,
        fill: sc ? sc.bg : C.offWhite,
        font: sc
          ? {
            name: "Segoe UI",
            size: 9,
            bold: true,
            color: { argb: sc.fg }
          }
          : mkFont(C.mutedText, 9),

        align: mkAlign("center", "middle"),
        border: thinBorder,
      });

      // Col I - Comments
      applyCell(ws.getCell(currentRow, 9), {
        value: r.comment || "—",
        fill: isOdd ? C.altRow : C.white,
        font: mkFont(C.mutedText, 8, false),
        align: mkAlign("left", "middle", true),
        border: thinBorder,
      });





      // Auto-height: estimate ~15pt per 60 chars of question stem
      const stemLen = (r.questionStem || "").length;
      const commentLen = (r.comment || "").length;
      const neededLines = Math.max(
        Math.ceil(stemLen / 55),
        Math.ceil(commentLen / 35),
        2
      );
      setHeight(currentRow, Math.max(36, neededLines * 15));

      currentRow++;
    });

    // ════════════════════════════════════════════════════════════════════════
    // SECTION 7 - VERTICAL MERGING of Domain & Subdomain columns
    // ════════════════════════════════════════════════════════════════════════
    if (sorted.length > 0) {
      let lastDom = "", lastSub = "";
      let domStart = DATA_START, subStart = DATA_START;

      sorted.forEach((r, i) => {
        const rowNum = DATA_START + i;
        const isLastRow = i === sorted.length - 1;

        // Domain column merge
        if (r.domain !== lastDom) {
          if (i > 0 && rowNum - 1 > domStart) {
            mergeCells(domStart, 1, rowNum - 1, 1);
          }
          domStart = rowNum;
          lastDom = r.domain;
        }
        if (isLastRow && rowNum > domStart) {
          mergeCells(domStart, 1, rowNum, 1);
        }

        // Subdomain column merge
        if (r.subdomain !== lastSub || r.domain !== lastDom) {
          if (i > 0 && rowNum - 1 > subStart) {
            mergeCells(subStart, 2, rowNum - 1, 2);
          }
          subStart = rowNum;
          lastSub = r.subdomain;
        }
        if (isLastRow && rowNum > subStart) {
          mergeCells(subStart, 2, rowNum, 2);
        }
      });
    }

    // ════════════════════════════════════════════════════════════════════════
    // SECTION 8 - FOOTER TABLES  (below data)
    // ════════════════════════════════════════════════════════════════════════

    // ════════════════════════════════════════════════════════════════════════
    // PREMIUM ANALYTICS SECTION
    // ════════════════════════════════════════════════════════════════════════

    const summaryStartRow = currentRow + 3;

    // ── Footer row ───────────────────────────────────────────────────────────
    // const footerRow = Math.max(dRow, gRow) + 1;
    // mergeCells(footerRow, 1, footerRow, 9);
    // applyCell(ws.getCell(footerRow, 1), {
    //   value: `Generated by TBD Platform  •  ${completedDate}`,
    //   fill: C.navy,
    //   font: mkFont(C.white, 8, false),
    //   align: mkAlign("center", "middle"),
    // });
    // setHeight(footerRow, 18);

    // ── Send file ────────────────────────────────────────────────────────────
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=Individual_Response_Report_${empName.replace(/\s+/g, "_")}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error("Error generating Excel report:", error);
    res.status(500).json({ message: "Error generating Excel report", error: error.message });
  }
};
