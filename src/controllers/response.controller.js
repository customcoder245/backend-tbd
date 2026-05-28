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

/**
 * EXPORT ORGANIZATION-WIDE REPORT TO EXCEL
 */
export const exportOrganizationReportExcel = async (req, res) => {
  try {
    const { orgName } = req.params;

    if (!orgName) {
      return res.status(400).json({ message: "Organization name is required." });
    }

    // 1. Fetch all users belonging to the organization
    const User = (await import("../models/user.model.js")).default;
    const users = await User.find({ orgName: { $regex: new RegExp("^" + orgName + "$", "i") } }).lean();
    
    // 2. Fetch completed assessments for these users
    const Assessment = (await import("../models/assessment.model.js")).default;
    const assessments = await Assessment.find({
      orgName: { $regex: new RegExp("^" + orgName + "$", "i") },
      isCompleted: true,
      isDeleted: { $ne: true }
    }).lean();

    if (!assessments.length) {
      return res.status(404).json({ message: "No completed assessments found for this organization." });
    }

    // 3. Fetch submitted assessments to use snapshots where available
    const SubmittedAssessment = (await import("../models/submittedAssessment.model.js")).default;
    const assessmentIds = assessments.map(a => a._id);
    const submittedDocs = await SubmittedAssessment.find({
      assessmentId: { $in: assessmentIds }
    }).lean();

    const submittedMap = {};
    submittedDocs.forEach(s => {
      submittedMap[s.assessmentId.toString()] = s;
    });

    const userMap = {};
    users.forEach(u => {
      userMap[u._id.toString()] = u;
    });

    const reportsData = [];
    const questionMap = new Map();

    for (const assessment of assessments) {
      const sub = submittedMap[assessment._id.toString()];
      const responses = sub ? sub.responses : assessment.responses;
      const userDetails = sub ? sub.userDetails : (assessment.userDetails || {});
      const scores = sub ? sub.scores : assessment.scores;
      const submittedAt = sub ? sub.submittedAt : (assessment.submittedAt || assessment.createdAt);
      const stakeholder = sub ? sub.stakeholder : assessment.stakeholder;

      const user = userMap[assessment.userId?.toString()];
      const empName = userDetails.firstName
        ? `${userDetails.firstName} ${userDetails.lastName || ""}`.trim()
        : (user ? `${user.firstName} ${user.lastName || ""}`.trim() : "Participant");
      const email = userDetails.email || user?.email || assessment.employeeEmail || "";
      const dept = userDetails.department || user?.department || "N/A";
      const role = userDetails.role || user?.role || "N/A";

      reportsData.push({
        assessmentId: assessment._id.toString(),
        empName,
        email,
        dept,
        role,
        submittedAt,
        responses,
        scores,
        stakeholder
      });

      // Collect unique questions answered
      for (const resp of responses) {
        if (!questionMap.has(resp.questionCode)) {
          questionMap.set(resp.questionCode, {
            domain: resp.domain,
            subdomain: resp.subdomain,
            questionCode: resp.questionCode,
            questionStem: resp.questionStem,
            questionType: resp.questionType,
            scale: resp.scale
          });
        }
      }
    }

    // 4. Sort questions
    const domainOrder = {
      "People Potential": 1,
      "Operational Steadiness": 2,
      "Leadership Effectiveness": 2,
      "Digital Fluency": 3,
      "Execution Excellence": 3,
    };
    const sortedQuestions = Array.from(questionMap.values()).sort((a, b) => {
      const dA = domainOrder[a.domain] || 99;
      const dB = domainOrder[b.domain] || 99;
      if (dA !== dB) return dA - dB;
      if (a.domain !== b.domain) return a.domain.localeCompare(b.domain);
      if (a.subdomain !== b.subdomain) return a.subdomain.localeCompare(b.subdomain);
      return (a.questionCode || "").localeCompare(b.questionCode || "");
    });

    // 5. Setup Workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "TBD Platform";
    workbook.created = new Date();

    // ────────────────────────────────────────────────────────────────────────
    // SHEET 1: HOME (Interactive Selection Hub)
    // ────────────────────────────────────────────────────────────────────────
    const wsHome = workbook.addWorksheet("Home", {
      views: [{ showGridLines: true, zoomScale: 100 }]
    });

    wsHome.columns = [
      { width: 4 },   // A (spacer)
      { width: 15 },  // B (Role dropdown card)
      { width: 15 },  // C
      { width: 15 },  // D
      { width: 4 },   // E (spacer)
      { width: 15 },  // F (Dept dropdown card)
      { width: 15 },  // G
      { width: 15 },  // H
      { width: 4 },   // I (spacer)
      { width: 15 },  // J (Person dropdown card)
      { width: 15 },  // K
      { width: 15 },  // L
      { width: 4 },   // M (spacer)
    ];

    // Banner Header
    wsHome.mergeCells("B2:L2");
    wsHome.getRow(2).height = 42;
    const titleCell = wsHome.getCell("B2");
    titleCell.value = "EXCEL RESPONSE REPORTING SYSTEM";
    titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F2547" } };
    titleCell.font = { name: "Segoe UI", size: 16, bold: true, color: { argb: "FFFFFFFF" } };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };

    // Sub-title bar
    wsHome.mergeCells("B3:L3");
    wsHome.getRow(3).height = 20;
    const subTitleCell = wsHome.getCell("B3");
    subTitleCell.value = `ORGANIZATION: ${orgName.toUpperCase()}`;
    subTitleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1A3A6B" } };
    subTitleCell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    subTitleCell.alignment = { horizontal: "center", vertical: "middle" };

    // Height setups
    wsHome.getRow(5).height = 28;
    wsHome.getRow(7).height = 28;
    wsHome.getRow(16).height = 20;
    wsHome.getRow(17).height = 20;

    const applyCardHeader = (cell, text, bg) => {
      cell.value = text;
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
      cell.font = { name: "Segoe UI", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
    };

    // Card 1 Header
    wsHome.mergeCells("B5:D5");
    applyCardHeader(wsHome.getCell("B5"), "1. SELECT ROLE", "FF7C3AED");

    // Card 1 Dropdown
    wsHome.mergeCells("B7:D7");
    const roleCell = wsHome.getCell("B7");
    roleCell.font = { name: "Segoe UI", size: 11, bold: true, color: { argb: "FF1E2A3B" } };
    roleCell.alignment = { horizontal: "center", vertical: "middle" };
    roleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
    roleCell.border = {
      top: { style: "thin", color: { argb: "FFAAB8CC" } },
      bottom: { style: "thin", color: { argb: "FFAAB8CC" } },
      left: { style: "thin", color: { argb: "FFAAB8CC" } },
      right: { style: "thin", color: { argb: "FFAAB8CC" } }
    };

    // Card 1 Info
    wsHome.mergeCells("B10:D14");
    const roleDescCell = wsHome.getCell("B10");
    roleDescCell.value = "✔ Roles are the top level in the organization.\n\n✔ Selecting a role filters available departments in card 2.";
    roleDescCell.font = { name: "Segoe UI", size: 9.5, italic: true, color: { argb: "FF4C1D95" } };
    roleDescCell.alignment = { horizontal: "left", vertical: "top", wrapText: true };
    roleDescCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F0FF" } };
    roleDescCell.border = {
      top: { style: "thin", color: { argb: "FFD0D8E4" } },
      bottom: { style: "thin", color: { argb: "FFD0D8E4" } },
      left: { style: "thin", color: { argb: "FFD0D8E4" } },
      right: { style: "thin", color: { argb: "FFD0D8E4" } }
    };

    // Card 2 Header
    wsHome.mergeCells("F5:H5");
    applyCardHeader(wsHome.getCell("F5"), "2. SELECT DEPARTMENT", "FF0E9F6E");

    // Card 2 Dropdown
    wsHome.mergeCells("F7:H7");
    const deptCell = wsHome.getCell("F7");
    deptCell.font = { name: "Segoe UI", size: 11, bold: true, color: { argb: "FF1E2A3B" } };
    deptCell.alignment = { horizontal: "center", vertical: "middle" };
    deptCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
    deptCell.border = {
      top: { style: "thin", color: { argb: "FFAAB8CC" } },
      bottom: { style: "thin", color: { argb: "FFAAB8CC" } },
      left: { style: "thin", color: { argb: "FFAAB8CC" } },
      right: { style: "thin", color: { argb: "FFAAB8CC" } }
    };

    // Card 2 Info
    wsHome.mergeCells("F10:H14");
    const deptDescCell = wsHome.getCell("F10");
    deptDescCell.value = "✔ Departments filter dynamically by selected role.\n\n✔ Selecting a department filters participant list in card 3.";
    deptDescCell.font = { name: "Segoe UI", size: 9.5, italic: true, color: { argb: "FF065F46" } };
    deptDescCell.alignment = { horizontal: "left", vertical: "top", wrapText: true };
    deptDescCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE6F9EE" } };
    deptDescCell.border = {
      top: { style: "thin", color: { argb: "FFD0D8E4" } },
      bottom: { style: "thin", color: { argb: "FFD0D8E4" } },
      left: { style: "thin", color: { argb: "FFD0D8E4" } },
      right: { style: "thin", color: { argb: "FFD0D8E4" } }
    };

    // Card 3 Header
    wsHome.mergeCells("J5:L5");
    applyCardHeader(wsHome.getCell("J5"), "3. SELECT PERSON", "FFEA580C");

    // Card 3 Dropdown
    wsHome.mergeCells("J7:L7");
    const personCell = wsHome.getCell("J7");
    personCell.font = { name: "Segoe UI", size: 11, bold: true, color: { argb: "FF1E2A3B" } };
    personCell.alignment = { horizontal: "center", vertical: "middle" };
    personCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
    personCell.border = {
      top: { style: "thin", color: { argb: "FFAAB8CC" } },
      bottom: { style: "thin", color: { argb: "FFAAB8CC" } },
      left: { style: "thin", color: { argb: "FFAAB8CC" } },
      right: { style: "thin", color: { argb: "FFAAB8CC" } }
    };

    // Card 3 Info
    wsHome.mergeCells("J10:L14");
    const personDescCell = wsHome.getCell("J10");
    personDescCell.value = "✔ People lists are fully dependent on selected role and department.\n\n✔ Choose a person and click below to view details!";
    personDescCell.font = { name: "Segoe UI", size: 9.5, italic: true, color: { argb: "FF7C2D12" } };
    personDescCell.alignment = { horizontal: "left", vertical: "top", wrapText: true };
    personDescCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFDF2F8" } };
    personDescCell.border = {
      top: { style: "thin", color: { argb: "FFD0D8E4" } },
      bottom: { style: "thin", color: { argb: "FFD0D8E4" } },
      left: { style: "thin", color: { argb: "FFD0D8E4" } },
      right: { style: "thin", color: { argb: "FFD0D8E4" } }
    };

    // Go to Report Button
    wsHome.mergeCells("J16:L17");
    const btnCell = wsHome.getCell("J16");
    btnCell.value = { text: "VIEW DYNAMIC REPORT →", hyperlink: "#'Report'!A1" };
    btnCell.font = { name: "Segoe UI", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
    btnCell.alignment = { horizontal: "center", vertical: "middle" };
    btnCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F2547" } };
    btnCell.border = {
      top: { style: "medium", color: { argb: "FFD4AF37" } },
      bottom: { style: "medium", color: { argb: "FFD4AF37" } },
      left: { style: "medium", color: { argb: "FFD4AF37" } },
      right: { style: "medium", color: { argb: "FFD4AF37" } }
    };

    // Set Defaults based on first available assessment
    if (reportsData.length > 0) {
      const defReport = reportsData[0];
      roleCell.value = defReport.role;
      deptCell.value = defReport.dept;
      personCell.value = defReport.empName;
    }

    // ────────────────────────────────────────────────────────────────────────
    // SHEET 2: CONFIG (Dependent Dynamic lists driven by Excel formulas)
    // ────────────────────────────────────────────────────────────────────────
    const wsConfig = workbook.addWorksheet("Config", {
      views: [{ showGridLines: true }]
    });

    wsConfig.columns = [
      { header: "Unique Roles", key: "uRoles", width: 20 },
      { header: "Filtered Departments", key: "fDepts", width: 22 },
      { header: "Filtered People", key: "fPeople", width: 25 }
    ];

    wsConfig.getCell("A2").value = { formula: "UNIQUE(FILTER(Raw_Data!D2:D10000, Raw_Data!D2:D10000<>\"\"))" };
    wsConfig.getCell("B2").value = { formula: "UNIQUE(FILTER(Raw_Data!E2:E10000, (Raw_Data!D2:D10000=Home!$B$7)*(Raw_Data!E2:E10000<>\"\"), \"\"))" };
    wsConfig.getCell("C2").value = { formula: "UNIQUE(FILTER(Raw_Data!B2:B10000, (Raw_Data!D2:D10000=Home!$B$7)*(Raw_Data!E2:E10000=Home!$F$7)*(Raw_Data!B2:B10000<>\"\"), \"\"))" };

    // Register Dynamic dropdown lists referencing spill outputs (# operator)
    wsHome.getCell("B7").dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: ["Config!$A$2#"]
    };
    wsHome.getCell("F7").dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: ["Config!$B$2#"]
    };
    wsHome.getCell("J7").dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: ["Config!$C$2#"]
    };

    // ────────────────────────────────────────────────────────────────────────
    // SHEET 3: RAW DATA (Hidden database dump)
    // ────────────────────────────────────────────────────────────────────────
    const wsRaw = workbook.addWorksheet("Raw_Data", {
      views: [{ showGridLines: true }]
    });
    wsRaw.state = "hidden";

    wsRaw.columns = [
      { header: "LookupKey", key: "lookupKey", width: 30 },
      { header: "Person Name", key: "personName", width: 22 },
      { header: "Email", key: "email", width: 24 },
      { header: "Role", key: "role", width: 15 },
      { header: "Department", key: "department", width: 18 },
      { header: "Completed Date", key: "completedDate", width: 16 },
      { header: "Question Code", key: "questionCode", width: 16 },
      { header: "Your Score", key: "yourScore", width: 12 },
      { header: "Comment", key: "comment", width: 35 },
      { header: "Question Stem", key: "questionStem", width: 50 },
      { header: "Domain", key: "domain", width: 22 },
      { header: "Subdomain", key: "subdomain", width: 22 },
      { header: "Question Type", key: "questionType", width: 16 },
      { header: "Max Score", key: "maxScore", width: 10 }
    ];

    reportsData.forEach(report => {
      const completedDateStr = new Date(report.submittedAt).toLocaleDateString("en-US", {
        day: "2-digit", month: "short", year: "numeric"
      });

      report.responses.forEach(resp => {
        const isFc = resp.questionType === "Forced-Choice" || resp.scale === "FORCED_CHOICE";
        const score = isFc ? resp.selectedOption : ((resp.value !== null && resp.value !== undefined) ? Number(resp.value) : "");
        const comment = resp.comment || "";

        wsRaw.addRow({
          lookupKey: `${report.empName}_${resp.questionCode}`,
          personName: report.empName,
          email: report.email,
          role: report.role,
          department: report.dept,
          completedDate: completedDateStr,
          questionCode: resp.questionCode,
          yourScore: score,
          comment: comment,
          questionStem: resp.questionStem || "",
          domain: resp.domain,
          subdomain: resp.subdomain,
          questionType: resp.questionType || "",
          maxScore: 5
        });
      });
    });

    // ────────────────────────────────────────────────────────────────────────
    // SHEET 4: REPORT (High-Fidelity Dashboard with live formulas)
    // ────────────────────────────────────────────────────────────────────────
    const wsRep = workbook.addWorksheet("Report", {
      views: [{ showGridLines: true, zoomScale: 90 }],
      pageSetup: { paperSize: 9, orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
    });

    wsRep.columns = [
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

    // Colors
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

      // Themes
      blue1: "FFE8F0FE", blue2: "FF1A56DB", blue3: "FF1E3A8A",
      green1: "FFE6F9EE", green2: "FF0E9F6E", green3: "FF065F46",
      purple1: "FFF5F0FF", purple2: "FF7C3AED", purple3: "FF4C1D95",
    };

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

    const mergeCells = (r1, c1, r2, c2) => {
      if (r2 > r1 || c2 > c1) wsRep.mergeCells(r1, c1, r2, c2);
    };

    const setHeight = (rowNum, pts) => { wsRep.getRow(rowNum).height = pts; };

    const thinBorder = mkBorder();
    const medBorder = mkBorder("FFAAB8CC", "medium");

    // Title banner
    mergeCells(1, 1, 3, 5);
    applyCell(wsRep.getCell(1, 1), {
      value: "DYNAMIC RESPONSE REPORT",
      fill: C.navy,
      font: { name: "Segoe UI", size: 20, bold: true, color: { argb: C.white } },
      align: { horizontal: "left", vertical: "middle", indent: 1 },
      border: {
        top: { style: "medium", color: { argb: "FFD4AF37" } },
        left: { style: "medium", color: { argb: "FFD4AF37" } },
        bottom: { style: "medium", color: { argb: "FFD4AF37" } },
        right: { style: "medium", color: { argb: "FFD4AF37" } },
      }
    });

    for (let c = 1; c <= 5; c++) {
      applyCell(wsRep.getCell(1, c), {
        border: { top: { style: "thick", color: { argb: "FFD4AF37" } } }
      });
    }

    mergeCells(4, 1, 4, 3);
    applyCell(wsRep.getCell(4, 1), {
      value: "Dynamic, interactive response analysis driven by Home sheet selection",
      fill: C.navyLight,
      font: { name: "Segoe UI", size: 9, bold: false, color: { argb: C.white } },
      align: { horizontal: "left", vertical: "middle", indent: 1 },
      border: thinBorder
    });

    // Back to Selection button
    mergeCells(4, 4, 4, 5);
    applyCell(wsRep.getCell(4, 4), {
      value: { text: "← BACK TO SELECTION", hyperlink: "#'Home'!A1" },
      fill: "FFE8F0FE",
      font: { name: "Segoe UI", size: 9, bold: true, color: { argb: "FF0F2547" } },
      align: { horizontal: "center", vertical: "middle" },
      border: thinBorder
    });

    // Metadata panel background
    for (let r = 1; r <= 4; r++) {
      for (let c = 6; c <= 9; c++) {
        applyCell(wsRep.getCell(r, c), {
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
      ["NAME", { formula: "Home!$J$7" }],
      ["DEPARTMENT", { formula: "XLOOKUP(Home!$J$7, Raw_Data!B:B, Raw_Data!E:E, \"N/A\")" }],
      ["ROLE", { formula: "XLOOKUP(Home!$J$7, Raw_Data!B:B, Raw_Data!D:D, \"N/A\")" }],
      ["COMPLETED", { formula: "TEXT(XLOOKUP(Home!$J$7, Raw_Data!B:B, Raw_Data!F:F, \"\"), \"DD-MMM-YYYY\")" }],
    ];

    metaRows.forEach(([label, val], i) => {
      const row = i + 1;
      mergeCells(row, 6, row, 7);
      applyCell(wsRep.getCell(row, 6), {
        value: label,
        fill: "FFF1F5F9",
        font: { name: "Segoe UI", size: 8, bold: true, color: { argb: C.mutedText } },
        align: { horizontal: "right", vertical: "middle" },
        border: thinBorder
      });

      mergeCells(row, 8, row, 9);
      applyCell(wsRep.getCell(row, 8), {
        value: val,
        fill: C.white,
        font: { name: "Segoe UI", size: 9, bold: true, color: { argb: C.darkText } },
        align: { horizontal: "left", vertical: "middle", indent: 1 },
        border: thinBorder
      });
    });

    setHeight(1, 24);
    setHeight(2, 24);
    setHeight(3, 24);
    setHeight(4, 18);
    setHeight(5, 8); // Spacer row

    // Assessment Summary Header
    mergeCells(6, 1, 6, 9);
    applyCell(wsRep.getCell(6, 1), {
      value: "DYNAMIC ASSESSMENT SUMMARY",
      fill: C.navy,
      font: mkFont(C.white, 9, true),
      align: mkAlign("center", "middle"),
    });
    setHeight(6, 18);

    // Cards
    mergeCells(7, 1, 7, 2);
    applyCell(wsRep.getCell(7, 1), {
      value: "Overall Avg Score",
      fill: C.offWhite,
      font: mkFont(C.mutedText, 8, true),
      align: mkAlign("center", "middle"),
      border: thinBorder,
    });
    mergeCells(8, 1, 8, 2);
    applyCell(wsRep.getCell(8, 1), {
      value: { formula: "TEXT(AVERAGEIF(Raw_Data!$B$2:$B$10000, Home!$J$7, Raw_Data!$H$2:$H$10000), \"0.00\") & \" / 5.00\"" },
      fill: C.white,
      font: mkFont(C.navy, 14, true),
      align: mkAlign("center", "middle"),
      border: thinBorder,
    });

    mergeCells(7, 3, 7, 4);
    applyCell(wsRep.getCell(7, 3), {
      value: "Total Questions",
      fill: C.offWhite,
      font: mkFont(C.mutedText, 8, true),
      align: mkAlign("center", "middle"),
      border: thinBorder,
    });
    mergeCells(8, 3, 8, 4);
    applyCell(wsRep.getCell(8, 3), {
      value: { formula: "COUNTIF(Raw_Data!$B$2:$B$10000, Home!$J$7)" },
      fill: C.white,
      font: mkFont(C.navy, 14, true),
      align: mkAlign("center", "middle"),
      border: thinBorder,
    });

    mergeCells(7, 5, 7, 9);
    applyCell(wsRep.getCell(7, 5), {
      value: "Performance Scale",
      fill: C.offWhite,
      font: mkFont(C.mutedText, 8, true),
      align: mkAlign("center", "middle"),
      border: thinBorder,
    });

    mergeCells(8, 5, 8, 6);
    applyCell(wsRep.getCell(8, 5), {
      value: "1-2 LOW",
      fill: "FFFEE2E2",
      font: { name: "Segoe UI", size: 9, bold: true, color: { argb: "FFDC2626" } },
      align: mkAlign("center", "middle"),
      border: thinBorder,
    });

    mergeCells(8, 7, 8, 7);
    applyCell(wsRep.getCell(8, 7), {
      value: "3 NEUTRAL",
      fill: "FFFEF3C7",
      font: { name: "Segoe UI", size: 9, bold: true, color: { argb: "FFD97706" } },
      align: mkAlign("center", "middle"),
      border: thinBorder,
    });

    mergeCells(8, 8, 8, 9);
    applyCell(wsRep.getCell(8, 8), {
      value: "4-5 HIGH",
      fill: "FFD1FAE5",
      font: { name: "Segoe UI", size: 9, bold: true, color: { argb: "FF047857" } },
      align: mkAlign("center", "middle"),
      border: thinBorder,
    });

    setHeight(7, 18);
    setHeight(8, 24);
    setHeight(9, 8);
    setHeight(10, 8);

    // Table headers
    const repHeaders = [
      "Domain", "Sub-Domain", "Question Code", "Question",
      "Question Type", "Your Score", "Max Score", "% Score", "Comments"
    ];
    repHeaders.forEach((h, i) => {
      const cell = wsRep.getCell(11, i + 1);
      applyCell(cell, {
        value: h,
        fill: C.navy,
        font: mkFont(C.white, 10, true),
        align: mkAlign(i === 3 || i === 8 ? "left" : "center", "middle"),
        border: medBorder,
      });
    });
    setHeight(11, 32);

    const getDomainTheme = (name = "") => {
      const n = name.toLowerCase();
      if (n.includes("people") || n.includes("potential"))
        return { bg: C.purple1, accent: "FF7C3AED", text: "FF4C1D95" };
      if (n.includes("operation") || n.includes("leader") || n.includes("steady") || n.includes("effect"))
        return { bg: "FFE6F9EE", accent: "FF0E9F6E", text: "FF065F46" };
      return { bg: "FFE8F0FE", accent: "FF1A56DB", text: "FF1E3A8A" };
    };

    const DATA_START = 12;
    let currentRow = DATA_START;

    sortedQuestions.forEach((q, idx) => {
      const theme = getDomainTheme(q.domain);
      const isOdd = idx % 2 !== 0;

      // Col A - Domain
      applyCell(wsRep.getCell(currentRow, 1), {
        value: q.domain,
        fill: theme.bg,
        font: { name: "Segoe UI", size: 9, bold: true, color: { argb: theme.text } },
        align: mkAlign("center", "middle", true),
        border: thinBorder,
      });

      // Col B - Subdomain
      applyCell(wsRep.getCell(currentRow, 2), {
        value: q.subdomain,
        fill: theme.bg,
        font: { name: "Segoe UI", size: 9, bold: false, color: { argb: theme.text } },
        align: mkAlign("center", "middle", true),
        border: thinBorder,
      });

      // Col C - Question Code
      applyCell(wsRep.getCell(currentRow, 3), {
        value: q.questionCode,
        fill: C.offWhite,
        font: mkFont(C.navy, 9, true),
        align: mkAlign("center", "middle"),
        border: thinBorder,
      });

      // Col D - Question Stem
      applyCell(wsRep.getCell(currentRow, 4), {
        value: q.questionStem || "—",
        fill: isOdd ? C.altRow : C.white,
        font: mkFont(C.darkText, 9),
        align: mkAlign("left", "middle", true),
        border: thinBorder,
      });

      // Col E - Question Type
      applyCell(wsRep.getCell(currentRow, 5), {
        value: q.questionType || "—",
        fill: C.offWhite,
        font: mkFont(C.mutedText, 8, true),
        align: mkAlign("center", "middle", true),
        border: thinBorder,
      });

      // Col F - Your Score (FORMULA!)
      applyCell(wsRep.getCell(currentRow, 6), {
        value: { formula: `XLOOKUP(Home!$J$7 & "_" & C${currentRow}, Raw_Data!$A$2:$A$10000, Raw_Data!$H$2:$H$10000, "—")` },
        fill: C.offWhite,
        font: mkFont(C.darkText, 10, true),
        align: mkAlign("center", "middle"),
        border: thinBorder,
      });

      // Col G - Max Score
      applyCell(wsRep.getCell(currentRow, 7), {
        value: 5,
        fill: C.offWhite,
        font: mkFont(C.mutedText, 9),
        align: mkAlign("center", "middle"),
        border: thinBorder,
      });

      // Col H - % Score (FORMULA!)
      applyCell(wsRep.getCell(currentRow, 8), {
        value: { formula: `IF(F${currentRow}="—", "—", IF(OR(F${currentRow}="A", F${currentRow}="B"), 50, F${currentRow}*20))` },
        fill: C.offWhite,
        font: mkFont(C.darkText, 9, true),
        align: mkAlign("center", "middle"),
        border: thinBorder,
      });

      // Col I - Comments (FORMULA!)
      applyCell(wsRep.getCell(currentRow, 9), {
        value: { formula: `XLOOKUP(Home!$J$7 & "_" & C${currentRow}, Raw_Data!$A$2:$A$10000, Raw_Data!$I$2:$I$10000, "—")` },
        fill: isOdd ? C.altRow : C.white,
        font: mkFont(C.mutedText, 8, false),
        align: mkAlign("left", "middle", true),
        border: thinBorder,
      });

      // Height
      const stemLen = (q.questionStem || "").length;
      const neededLines = Math.max(Math.ceil(stemLen / 55), 2);
      setHeight(currentRow, Math.max(36, neededLines * 15));

      currentRow++;
    });

    // Domain & Subdomain Merges
    if (sortedQuestions.length > 0) {
      let lastDom = "", lastSub = "";
      let domStart = DATA_START, subStart = DATA_START;

      sortedQuestions.forEach((q, i) => {
        const rowNum = DATA_START + i;
        const isLastRow = i === sortedQuestions.length - 1;

        if (q.domain !== lastDom) {
          if (i > 0 && rowNum - 1 > domStart) {
            mergeCells(domStart, 1, rowNum - 1, 1);
          }
          domStart = rowNum;
          lastDom = q.domain;
        }
        if (isLastRow && rowNum > domStart) {
          mergeCells(domStart, 1, rowNum, 1);
        }

        if (q.subdomain !== lastSub || q.domain !== lastDom) {
          if (i > 0 && rowNum - 1 > subStart) {
            mergeCells(subStart, 2, rowNum - 1, 2);
          }
          subStart = rowNum;
          lastSub = q.subdomain;
        }
        if (isLastRow && rowNum > subStart) {
          mergeCells(subStart, 2, rowNum, 2);
        }
      });
    }

    // Set Response Headers
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=Organization_Report_${orgName.replace(/\s+/g, "_")}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error("Error generating organization Excel report:", error);
    res.status(500).json({ message: "Error generating Excel report", error: error.message });
  }
};
