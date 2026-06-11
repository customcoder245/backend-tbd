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

    const submitted = await SubmittedAssessment.findOne({ assessmentId });
    if (submitted) {
      responses = submitted.responses || [];
      userDetails = submitted.userDetails || {};
      scores = submitted.scores || {};
      submittedAt = submitted.submittedAt || submitted.createdAt || new Date();
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
    }

    // 2. Format details
    const empName = userDetails.firstName ? `${userDetails.firstName} ${userDetails.lastName || ""}`.trim() : "Participant";
    const empDept = userDetails.department || "N/A";
    const empRole = userDetails.role || "N/A";
    const completedDate = new Date(submittedAt).toLocaleDateString("en-US", {
      day: "2-digit", month: "short", year: "numeric"
    });
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
    setHeight(9, 0);

    // Score distribution bar (row 9) — commented out, collapse row to remove gap
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
    setHeight(10, 0);

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



    // ── Freeze panes: freeze header row so column labels stay visible ─────────
    ws.views = [{
      state: "frozen",
      xSplit: 0,
      ySplit: 11,
      showGridLines: true,
      zoomScale: 90
    }];

    // ── AutoFilter on table header row ────────────────────────────────────────
    if (currentRow > DATA_START) {
      ws.autoFilter = {
        from: { row: 11, column: 1 },
        to: { row: currentRow - 1, column: 9 }
      };
    }

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

    const escapedName = orgName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const orgRegex = new RegExp(`^\\s*${escapedName}\\s*$`, 'i');

    // ════════════════════════════════════════════════════════════════════════
    // 1. PRIMARY DATA SOURCE: SubmittedAssessment
    // ════════════════════════════════════════════════════════════════════════
    const User = (await import("../models/user.model.js")).default;
    const SubmittedAssessment = (await import("../models/submittedAssessment.model.js")).default;

    const ALLOWED_ROLES = ["leader", "manager", "employee"];
    const isAllowedRole = (role) => {
      if (!role || role.trim() === "") return true;
      return ALLOWED_ROLES.includes(role.toLowerCase());
    };

    const allOrgUsers = await User.find({ orgName: orgRegex }).lean();
    const orgUsers = allOrgUsers.filter(u => ALLOWED_ROLES.includes((u.role || "").toLowerCase()));

    const userIds = orgUsers.map(u => u._id);
    const userEmails = orgUsers.map(u => (u.email || "").toLowerCase().trim()).filter(Boolean);
    const adminUserIds = allOrgUsers
      .filter(u => u.role === "admin" || u.role === "superAdmin")
      .map(u => u._id);

    const submittedOrConditions = [
      { "userDetails.orgName": orgRegex }
    ];
    if (userIds.length) submittedOrConditions.push({ userId: { $in: userIds } });
    if (userEmails.length) submittedOrConditions.push({ "userDetails.email": { $in: userEmails } });
    if (adminUserIds.length) submittedOrConditions.push({ adminId: { $in: adminUserIds } });

    const submittedDocs = await SubmittedAssessment.find({
      $or: submittedOrConditions,
      isDeleted: { $ne: true }
    }).lean();

    console.log(`[Excel Export] Org: ${orgName} | Org Users: ${orgUsers.length} | SubmittedAssessments: ${submittedDocs.length}`);

    if (!orgUsers.length && !submittedDocs.length) {
      return res.status(404).json({ message: "No data found for this organization." });
    }

    // ════════════════════════════════════════════════════════════════════════
    // 2. Build Participant Map
    // ════════════════════════════════════════════════════════════════════════
    const participantMap = new Map();
    const getFullName = (first, last) => `${first || ""} ${last || ""}`.trim();

    const findParticipant = (email, userId) => {
      if (email && participantMap.has(email)) return participantMap.get(email);
      if (userId) {
        for (const [, p] of participantMap) {
          if (p.userId === userId) return p;
        }
      }
      return null;
    };

    submittedDocs.forEach(sub => {
      const userDetails = sub.userDetails || {};
      const email = (userDetails.email || "").toLowerCase().trim();
      const userId = sub.userId ? sub.userId.toString() : "";
      const role = sub.stakeholder || userDetails.role || "";
      if (!isAllowedRole(role)) return;

      let existing = findParticipant(email, userId);
      if (existing) {
        const existingTime = existing.submittedAt ? new Date(existing.submittedAt).getTime() : 0;
        const newTime = sub.submittedAt ? new Date(sub.submittedAt).getTime() : 0;
        if (newTime >= existingTime) {
          existing.assessmentId = sub.assessmentId ? sub.assessmentId.toString() : (sub._id ? sub._id.toString() : "");
          existing.isCompleted = true;
          existing.submittedAt = sub.submittedAt || sub.createdAt;
          existing.responses = sub.responses || [];
          existing.scores = sub.scores || null;
          existing.stakeholder = sub.stakeholder || null;
          if (userDetails.firstName) existing.empName = getFullName(userDetails.firstName, userDetails.lastName);
          if (sub.stakeholder) existing.role = sub.stakeholder;
          else if (userDetails.role) existing.role = userDetails.role;
          if (userDetails.department) existing.dept = userDetails.department;
        }
      } else {
        const key = email || userId || sub._id.toString();
        if (!key) return;
        participantMap.set(key, {
          assessmentId: sub.assessmentId ? sub.assessmentId.toString() : (sub._id ? sub._id.toString() : ""),
          userId: userId,
          empName: getFullName(userDetails.firstName, userDetails.lastName) || "Participant",
          email: email || "",
          role: role,
          dept: userDetails.department || "N/A",
          isCompleted: true,
          submittedAt: sub.submittedAt || sub.createdAt,
          responses: sub.responses || [],
          scores: sub.scores || null,
          stakeholder: sub.stakeholder || null
        });
      }
    });

    orgUsers.forEach(u => {
      const email = (u.email || "").toLowerCase().trim();
      const userId = u._id.toString();
      const existing = findParticipant(email, userId);
      if (!existing) {
        const key = email || userId;
        if (!key) return;
        participantMap.set(key, {
          assessmentId: "",
          userId: userId,
          empName: getFullName(u.firstName, u.lastName) || "Participant",
          email: u.email || "",
          role: u.role || "",
          dept: u.department || "N/A",
          isCompleted: false,
          submittedAt: null,
          responses: [],
          scores: null,
          stakeholder: null
        });
      }
    });

    const reportsData = Array.from(participantMap.values());

    const toTitleCase = (str) => {
      if (!str) return "";
      const s = String(str).trim();
      if (!s || s.toLowerCase() === "n/a") return "N/A";
      return s.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
    };

    reportsData.forEach(r => {
      r.role = toTitleCase(r.role);
      r.dept = toTitleCase(r.dept);
    });

    const completedCount = reportsData.filter(r => r.isCompleted).length;

    // ════════════════════════════════════════════════════════════════════════
    // 3. Build questionMap and personQuestionCodes from actual responses
    // ════════════════════════════════════════════════════════════════════════
    const questionMap = new Map();
    const personQuestionCodes = new Map();

    reportsData.forEach(report => {
      if (report.isCompleted && report.responses) {
        report.responses.forEach(resp => {
          const hasScore =
            (resp.value !== null && resp.value !== undefined) ||
            (resp.selectedOption !== null && resp.selectedOption !== undefined && resp.selectedOption !== "");
          if (hasScore) {
            if (resp.domain && resp.subdomain && resp.questionStem) {
              questionMap.set(resp.questionCode, {
                domain: resp.domain,
                subdomain: resp.subdomain,
                questionCode: resp.questionCode,
                questionStem: resp.questionStem,
                questionType: resp.questionType,
                scale: resp.scale
              });
            }
            const nameKey = report.empName.trim();
            if (!personQuestionCodes.has(nameKey)) personQuestionCodes.set(nameKey, new Set());
            personQuestionCodes.get(nameKey).add(resp.questionCode);
          }
        });
      }
    });

    const domainOrder = {
      "Mindset & Adaptability": 1,
      "Psychological Health & Safety": 2,
      "People Potential": 3,
      "Relational & Emotional Intelligence": 4
    };
    const sortedQuestions = Array.from(questionMap.values()).sort((a, b) => {
      const dA = domainOrder[a.domain] || 99;
      const dB = domainOrder[b.domain] || 99;
      if (dA !== dB) return dA - dB;
      if (a.domain !== b.domain) return a.domain.localeCompare(b.domain);
      if (a.subdomain !== b.subdomain) return a.subdomain.localeCompare(b.subdomain);
      return (a.questionCode || "").localeCompare(b.questionCode || "");
    });

    // ════════════════════════════════════════════════════════════════════════
    // 4. Setup Workbook and Sheets
    // ════════════════════════════════════════════════════════════════════════
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "TBD Platform";
    workbook.created = new Date();

    // ------------------------- HOME SHEET -------------------------
    const wsHome = workbook.addWorksheet("Home", { views: [{ showGridLines: true, zoomScale: 100 }] });
    wsHome.columns = [
      { width: 4 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 },
      { width: 4 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 4 }
    ];

    wsHome.mergeCells("B2:L2");
    wsHome.getRow(2).height = 42;
    const titleCell = wsHome.getCell("B2");
    titleCell.value = "EXCEL RESPONSE REPORTING SYSTEM";
    titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F2547" } };
    titleCell.font = { name: "Segoe UI", size: 16, bold: true, color: { argb: "FFFFFFFF" } };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };

    wsHome.mergeCells("B3:L3");
    wsHome.getRow(3).height = 20;
    const subTitleCell = wsHome.getCell("B3");
    subTitleCell.value = `ORGANIZATION: ${orgName.toUpperCase()}`;
    subTitleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1A3A6B" } };
    subTitleCell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    subTitleCell.alignment = { horizontal: "center", vertical: "middle" };

    wsHome.getRow(5).height = 28;
    wsHome.getRow(7).height = 28;

    const applyCardHeader = (cell, text, bg) => {
      cell.value = text;
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
      cell.font = { name: "Segoe UI", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
    };

    wsHome.mergeCells("B5:F5");
    applyCardHeader(wsHome.getCell("B5"), "1. SELECT ROLE", "FF7C3AED");

    wsHome.mergeCells("B7:F7");
    const roleCell = wsHome.getCell("B7");
    roleCell.font = { name: "Segoe UI", size: 11, bold: true, color: { argb: "FF1E2A3B" } };
    roleCell.alignment = { horizontal: "center", vertical: "middle" };
    roleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
    roleCell.border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };

    wsHome.mergeCells("B9:F14");
    const roleDescCell = wsHome.getCell("B9");
    roleDescCell.value = "✔ Roles are the top level of hierarchy.\n\n✔ Selecting a role filters available people in card 2 dynamically.";
    roleDescCell.font = { name: "Segoe UI", size: 9.5, italic: true, color: { argb: "FF4C1D95" } };
    roleDescCell.alignment = { horizontal: "left", vertical: "top", wrapText: true };
    roleDescCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F0FF" } };

    wsHome.mergeCells("H5:L5");
    applyCardHeader(wsHome.getCell("H5"), "2. SELECT PERSON", "FFEA580C");

    wsHome.mergeCells("H7:L7");
    const personCell = wsHome.getCell("H7");
    personCell.font = { name: "Segoe UI", size: 11, bold: true, color: { argb: "FF1E2A3B" } };
    personCell.alignment = { horizontal: "center", vertical: "middle" };
    personCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
    personCell.border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };

    wsHome.mergeCells("H9:L14");
    const personDescCell = wsHome.getCell("H9");
    personDescCell.value = "✔ People lists are fully dependent on the selected role.\n\n✔ Choose a person and click below to view details!";
    personDescCell.font = { name: "Segoe UI", size: 9.5, italic: true, color: { argb: "FF7C2D12" } };
    personDescCell.alignment = { horizontal: "left", vertical: "top", wrapText: true };
    personDescCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFDF2F8" } };

    // Config sheet for dropdowns
    // ── EXCEL-COMPATIBLE NAMED RANGE APPROACH ────────────────────────────────
    // Excel does NOT support INDIRECT/CHOOSE/MATCH inside dataValidation formulae.
    // The fix: write each role's person list into its own _Config column, define a
    // workbook-level named range whose name equals the role value, then use
    // =INDIRECT(Home!$B$7) as the person-dropdown source.  INDIRECT of a named
    // range resolves correctly in both Excel and WPS.
    const wsConfig = workbook.addWorksheet("_Config", { views: [{ showGridLines: true }] });
    wsConfig.state = "hidden";

    const validEntries = reportsData.filter(r => r.empName && r.empName.trim() !== "" && r.role && r.role.trim() !== "");
    const roleToPersonMap = {};
    validEntries.forEach(r => {
      const roleKey = r.role.trim();
      if (!roleToPersonMap[roleKey]) roleToPersonMap[roleKey] = [];
      if (!roleToPersonMap[roleKey].includes(r.empName)) roleToPersonMap[roleKey].push(r.empName);
    });
    Object.keys(roleToPersonMap).forEach(k => roleToPersonMap[k].sort());
    const uniqueRolesSorted = Object.keys(roleToPersonMap).sort();

    // Helper: convert 1-based column index → Excel column letter(s)
    const colLetter = (n) => {
      let s = "";
      while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); }
      return s;
    };

    // Helper: sanitise a role string into a valid Excel defined-name
    // Rules: starts with letter/underscore, only letters/digits/underscores, max 255 chars
    const toDefinedName = (role) =>
      role
        .replace(/[^A-Za-z0-9_]/g, "_")   // replace spaces & specials with _
        .replace(/^([0-9])/, "_$1")         // can't start with a digit
        .substring(0, 255);

    const roleColMap = {};
    uniqueRolesSorted.forEach((role, idx) => {
      const col = idx + 1;
      const people = roleToPersonMap[role];
      const allPeople = ["Select Person", ...people];
      roleColMap[role] = { col, count: allPeople.length };
      wsConfig.getCell(1, col).value = role;
      allPeople.forEach((name, pi) => { wsConfig.getCell(pi + 2, col).value = name; });

      // Define a workbook-level named range for this role so INDIRECT(B7) resolves
      const letter = colLetter(col);
      const endRow = allPeople.length + 1;   // row 2 .. endRow  (header in row 1)
      const definedName = toDefinedName(role);
      workbook.definedNames.add(
        `_Config!$${letter}$2:$${letter}$${endRow}`,
        definedName
      );
    });

    // Role dropdown — inline list is fine and works in both apps
    const roleDropListStr = '"' + (uniqueRolesSorted.length > 0 ? uniqueRolesSorted.join(",") : "Leader,Manager,Employee") + '"';
    wsHome.getCell("B7").dataValidation = {
      type: "list", allowBlank: true, formulae: [roleDropListStr],
      showErrorMessage: true, errorTitle: "Invalid Role", error: "Please select a role from the dropdown."
    };

    // Person dropdown — INDIRECT of the named range that matches the selected role.
    // This formula works in Excel AND WPS because it resolves to a static named range.
    if (uniqueRolesSorted.length > 0) {
      wsHome.getCell("H7").dataValidation = {
        type: "list", allowBlank: true,
        formulae: ["INDIRECT(SUBSTITUTE(Home!$B$7,\" \",\"_\"))"],
        showErrorMessage: true, errorTitle: "Invalid Person", error: "Please select a person from the dropdown."
      };
    } else {
      wsHome.getCell("H7").dataValidation = { type: "list", allowBlank: true, formulae: ['"Select Person"'], showErrorMessage: false };
    }

    roleCell.value = uniqueRolesSorted.length > 0 ? uniqueRolesSorted[0] : "";
    personCell.value = "Select Person";

    // Warning row
    wsHome.mergeCells("H8:L8");
    wsHome.getRow(8).height = 22;
    const warnCell = wsHome.getCell("H8");
    wsHome.mergeCells("B8:F8");
    const leftSpacer8 = wsHome.getCell("B8");
    leftSpacer8.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFFFF" } };
    if (uniqueRolesSorted.length > 0) {
      // COUNTIF against INDIRECT(named range) — works in Excel and WPS
      warnCell.value = { formula: `IF(OR(B7="",H7="",H7="Select Person"),"",IF(COUNTIF(INDIRECT(SUBSTITUTE(Home!$B$7," ","_")),H7)=0,"⚠  Role changed — please re-select person from the dropdown above",""))` };
    } else { warnCell.value = ""; }
    warnCell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFDC2626" } };
    warnCell.alignment = { horizontal: "center", vertical: "middle" };
    warnCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFFFF" } };
    wsHome.addConditionalFormatting({
      ref: "H8:L8",
      rules: [{ type: "expression", formulae: ['H8<>""'], style: { fill: { type: "pattern", pattern: "solid", bgColor: { argb: "FFFEE2E2" } }, font: { bold: true, color: { argb: "FFDC2626" } } } }]
    });

    // ------------------------- REPORT SHEET (dynamic) -------------------------
    const wsRepReal = workbook.addWorksheet("Report", {
      views: [{ state: "frozen", xSplit: 0, ySplit: 11, showGridLines: true, zoomScale: 90 }],
      pageSetup: { paperSize: 9, orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
    });
    wsRepReal.columns = [
      { width: 26 }, { width: 28 }, { width: 16 }, { width: 62 }, { width: 18 },
      { width: 13 }, { width: 13 }, { width: 13 }, { width: 42 }
    ];

    // ------------------------- RAW DATA SHEET (hidden) -------------------------
    const wsRaw = workbook.addWorksheet("Raw_Data", { views: [{ showGridLines: true }] });
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
      { header: "Max Score", key: "maxScore", width: 10 },
      { header: "SeqNum", key: "seqNum", width: 8 },
      { header: "PersonSeqKey", key: "personSeqKey", width: 35 }
    ];

    const personSeqMap = new Map();
    reportsData.forEach(report => {
      if (report.isCompleted) {
        const completedDateStr = new Date(report.submittedAt).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
        const domOrder = { "Mindset & Adaptability": 1, "Psychological Health & Safety": 2, "People Potential": 3, "Relational & Emotional Intelligence": 4 };
        const sortedResponses = [...report.responses].sort((a, b) => {
          const dA = domOrder[a.domain] || 99, dB = domOrder[b.domain] || 99;
          if (dA !== dB) return dA - dB;
          if (a.domain !== b.domain) return a.domain.localeCompare(b.domain);
          if (a.subdomain !== b.subdomain) return a.subdomain.localeCompare(b.subdomain);
          return (a.questionCode || "").localeCompare(b.questionCode || "");
        });
        let seq = 0;
        const nameKey = report.empName.trim();
        sortedResponses.forEach(resp => {
          const isFc = resp.questionType === "Forced-Choice" || resp.scale === "FORCED_CHOICE";
          const score = isFc ? resp.selectedOption : ((resp.value !== null && resp.value !== undefined) ? Number(resp.value) : "");
          if (score === "" || score === null || score === undefined) return;
          seq++;
          wsRaw.addRow({
            lookupKey: `${nameKey}_${resp.questionCode.trim()}`,
            personName: report.empName,
            email: report.email,
            role: report.role,
            department: report.dept,
            completedDate: completedDateStr,
            questionCode: resp.questionCode,
            yourScore: score,
            comment: resp.comment || "-",
            questionStem: resp.questionStem || "",
            domain: resp.domain,
            subdomain: resp.subdomain,
            questionType: resp.questionType || "",
            maxScore: 5,
            seqNum: seq,
            personSeqKey: `${nameKey}_${seq}`
          });
        });
        personSeqMap.set(nameKey, seq);
      } else {
        wsRaw.addRow({
          lookupKey: `${report.empName}_NO_CODE`, personName: report.empName, email: report.email,
          role: report.role, department: report.dept, completedDate: "Not Completed",
          questionCode: "", yourScore: "", comment: "No assessment submitted", questionStem: "",
          domain: "", subdomain: "", questionType: "", maxScore: "", seqNum: "", personSeqKey: ""
        });
      }
    });

    const maxQuestionsPerPerson = personSeqMap.size > 0 ? Math.max(...Array.from(personSeqMap.values())) : sortedQuestions.length;

    // Colour palette
    const C = {
      navy: "FF0F2547", navyLight: "FF1A3A6B", white: "FFFFFFFF", offWhite: "FFF8FAFC",
      lightGrey: "FFE8EDF4", midGrey: "FFD0D8E4", darkText: "FF1E2A3B", mutedText: "FF6B7A90",
      altRow: "FFF4F6FA",
      s1bg: "FFFEE2E2", s1fg: "FFDC2626", s2bg: "FFFEF0E0", s2fg: "FFEA580C",
      s3bg: "FFFEF9C3", s3fg: "FFB45309", s4bg: "FFE6F9EE", s4fg: "FF059669",
      s5bg: "FFD1FAE5", s5fg: "FF047857"
    };

    const wsRep = wsRepReal;
    const mkFill = (argb) => ({ type: "pattern", pattern: "solid", fgColor: { argb } });
    const mkFont = (argb, sz, bold = false) => ({ name: "Segoe UI", size: sz, bold, color: { argb } });
    const mkAlign = (h, v = "middle", wrap = false) => ({ horizontal: h, vertical: v, wrapText: wrap });
    const mkBorder = (clr = "FFD0D8E4", style = "thin") => ({
      top: { style, color: { argb: clr } }, left: { style, color: { argb: clr } },
      bottom: { style, color: { argb: clr } }, right: { style, color: { argb: clr } }
    });
    const applyCell = (cell, opts = {}) => {
      if (opts.value !== undefined) cell.value = opts.value;
      if (opts.fill) cell.fill = mkFill(opts.fill);
      if (opts.font) cell.font = opts.font;
      if (opts.align) cell.alignment = opts.align;
      if (opts.border) cell.border = opts.border;
    };
    const mergeCells = (r1, c1, r2, c2) => { if (r2 > r1 || c2 > c1) wsRep.mergeCells(r1, c1, r2, c2); };
    const setHeight = (rowNum, pts) => { wsRep.getRow(rowNum).height = pts; };
    const thinBorder = mkBorder();
    const medBorder = mkBorder("FFAAB8CC", "medium");

    // Header
    mergeCells(1, 1, 3, 5);
    applyCell(wsRep.getCell(1, 1), {
      value: "INDIVIDUAL RESPONSE REPORT", fill: C.navy,
      font: { name: "Segoe UI", size: 20, bold: true, color: { argb: C.white } },
      align: { horizontal: "left", vertical: "middle", indent: 1 },
      border: { top: { style: "medium", color: { argb: "FFD4AF37" } }, left: { style: "medium", color: { argb: "FFD4AF37" } }, bottom: { style: "medium", color: { argb: "FFD4AF37" } }, right: { style: "medium", color: { argb: "FFD4AF37" } } }
    });
    for (let c = 1; c <= 5; c++) applyCell(wsRep.getCell(1, c), { border: { top: { style: "thick", color: { argb: "FFD4AF37" } } } });
    mergeCells(4, 1, 4, 5);
    applyCell(wsRep.getCell(4, 1), { value: "Detailed response analysis by domain, sub-domain and question performance", fill: C.navyLight, font: mkFont(C.white, 9, false), align: mkAlign("left", "middle", false), border: thinBorder });
    for (let r = 1; r <= 4; r++) for (let c = 6; c <= 9; c++) applyCell(wsRep.getCell(r, c), { fill: "FFF8FAFC", border: { top: { style: "thin", color: { argb: "FFE2E8F0" } }, left: { style: "thin", color: { argb: "FFE2E8F0" } }, bottom: { style: "thin", color: { argb: "FFE2E8F0" } }, right: { style: "thin", color: { argb: "FFE2E8F0" } } } });
    const metaRows = [
      ["NAME", { formula: "Home!$H$7" }],
      ["DEPARTMENT", { formula: 'IFERROR(XLOOKUP(Home!$H$7,Raw_Data!$B:$B,Raw_Data!$E:$E),"N/A")' }],
      ["ROLE", { formula: 'IFERROR(XLOOKUP(Home!$H$7,Raw_Data!$B:$B,Raw_Data!$D:$D),"N/A")' }],
      ["COMPLETED", { formula: 'IFERROR(TEXT(XLOOKUP(Home!$H$7,Raw_Data!$B:$B,Raw_Data!$F:$F),"DD-MMM-YYYY"),"—")' }]
    ];
    metaRows.forEach(([label, val], i) => {
      const row = i + 1;
      mergeCells(row, 6, row, 7);
      applyCell(wsRep.getCell(row, 6), { value: label, fill: "FFF1F5F9", font: mkFont(C.mutedText, 8, true), align: { horizontal: "right", vertical: "middle" }, border: thinBorder });
      mergeCells(row, 8, row, 9);
      applyCell(wsRep.getCell(row, 8), { value: val, fill: C.white, font: mkFont(C.darkText, 9, true), align: { horizontal: "left", vertical: "middle", indent: 1 }, border: thinBorder });
    });
    setHeight(1, 24); setHeight(2, 24); setHeight(3, 24); setHeight(4, 18); setHeight(5, 8);

    // Summary cards
    mergeCells(6, 1, 6, 9);
    applyCell(wsRep.getCell(6, 1), { value: "ASSESSMENT SUMMARY", fill: C.navy, font: mkFont(C.white, 9, true), align: mkAlign("center", "middle") });
    setHeight(6, 18);
    const repCards = [
      { cols: [1, 2], label: "Overall Avg Score", val: { formula: 'IFERROR(TEXT(AVERAGEIF(Raw_Data!$B$2:$B$10000, Home!$H$7, Raw_Data!$H$2:$H$10000), "0.00") & " / 5.00", "— / 5.00")' } },
      { cols: [3, 4], label: "Total Questions", val: { formula: 'COUNTIFS(Raw_Data!$B$2:$B$10000, Home!$H$7, Raw_Data!$G$2:$G$10000, "<>")' } },
      { cols: [5, 9], label: "Performance Scale", val: "LOW | NEUTRAL | HIGH" }
    ];
    repCards.forEach(({ cols, label, val }) => {
      mergeCells(7, cols[0], 7, cols[1]);
      applyCell(wsRep.getCell(7, cols[0]), { value: label, fill: C.offWhite, font: mkFont(C.mutedText, 8, true), align: mkAlign("center", "middle"), border: thinBorder });
      if (label === "Performance Scale") {
        mergeCells(8, 5, 8, 6); applyCell(wsRep.getCell(8, 5), { value: "1-2 LOW", fill: "FFFEE2E2", font: { name: "Segoe UI", size: 9, bold: true, color: { argb: "FFDC2626" } }, align: mkAlign("center", "middle"), border: thinBorder });
        mergeCells(8, 7, 8, 7); applyCell(wsRep.getCell(8, 7), { value: "3 NEUTRAL", fill: "FFFEF3C7", font: { name: "Segoe UI", size: 9, bold: true, color: { argb: "FFD97706" } }, align: mkAlign("center", "middle"), border: thinBorder });
        mergeCells(8, 8, 8, 9); applyCell(wsRep.getCell(8, 8), { value: "4-5 HIGH", fill: "FFD1FAE5", font: { name: "Segoe UI", size: 9, bold: true, color: { argb: "FF047857" } }, align: mkAlign("center", "middle"), border: thinBorder });
      } else {
        mergeCells(8, cols[0], 8, cols[1]);
        applyCell(wsRep.getCell(8, cols[0]), { value: val, fill: C.white, font: mkFont(C.navy, 14, true), align: mkAlign("center", "middle"), border: thinBorder });
      }
    });
    setHeight(7, 18); setHeight(8, 24); setHeight(9, 0); setHeight(10, 0);

    // Table headers
    const repHeaders = ["Domain", "Sub-Domain", "Question Code", "Question", "Question Type", "Your Score", "Max Score", "% Score", "Comments"];
    repHeaders.forEach((h, i) => {
      const cell = wsRep.getCell(11, i + 1);
      applyCell(cell, { value: h, fill: C.navy, font: mkFont(C.white, 10, true), align: mkAlign(i === 3 || i === 8 ? "left" : "center", "middle"), border: medBorder });
    });
    setHeight(11, 32);

    const DATA_START = 12;
    let currentRow = DATA_START;

    const noPersonSelected = `OR(Home!$H$7="",Home!$H$7="Select Person")`;
    const rdXL = (seqN, resultCol) => `IFERROR(XLOOKUP(TRIM(Home!$H$7)&"_${seqN}",Raw_Data!$P:$P,Raw_Data!${resultCol}:${resultCol},""),"")`;

    for (let seqN = 1; seqN <= maxQuestionsPerPerson; seqN++) {
      const isOdd = (seqN % 2) !== 0;
      const hideRow = `OR(${noPersonSelected},${rdXL(seqN, "G")}="")`;

      applyCell(wsRep.getCell(currentRow, 1), { value: { formula: `IF(${hideRow},"",${rdXL(seqN, "K")})` }, fill: C.offWhite, font: { name: "Segoe UI", size: 9, bold: true, color: { argb: C.darkText } }, align: mkAlign("center", "middle", true), border: thinBorder });
      applyCell(wsRep.getCell(currentRow, 2), { value: { formula: `IF(${hideRow},"",${rdXL(seqN, "L")})` }, fill: C.offWhite, font: { name: "Segoe UI", size: 9, bold: false, color: { argb: C.darkText } }, align: mkAlign("center", "middle", true), border: thinBorder });
      applyCell(wsRep.getCell(currentRow, 3), { value: { formula: `IF(${hideRow},"",${rdXL(seqN, "G")})` }, fill: C.offWhite, font: mkFont(C.navy, 9, true), align: mkAlign("center", "middle"), border: thinBorder });
      applyCell(wsRep.getCell(currentRow, 4), { value: { formula: `IF(${hideRow},"",${rdXL(seqN, "J")})` }, fill: isOdd ? C.altRow : C.white, font: mkFont(C.darkText, 9), align: mkAlign("left", "middle", true), border: thinBorder });
      applyCell(wsRep.getCell(currentRow, 5), { value: { formula: `IF(${hideRow},"",${rdXL(seqN, "M")})` }, fill: C.offWhite, font: mkFont(C.mutedText, 8, true), align: mkAlign("center", "middle", true), border: thinBorder });
      applyCell(wsRep.getCell(currentRow, 6), { value: { formula: `IF(${hideRow},"",IFERROR(XLOOKUP(TRIM(Home!$H$7)&"_"&${rdXL(seqN,"G")},Raw_Data!$A:$A,Raw_Data!$H:$H,"—"),"—"))` }, fill: C.offWhite, font: { name: "Segoe UI", size: 11, bold: true, color: { argb: C.darkText } }, align: mkAlign("center", "middle"), border: thinBorder });
      const fCell = `F${currentRow}`;
      [{ val: 1, bg: C.s1bg, fg: C.s1fg }, { val: 2, bg: C.s2bg, fg: C.s2fg }, { val: 3, bg: C.s3bg, fg: C.s3fg }, { val: 4, bg: C.s4bg, fg: C.s4fg }, { val: 5, bg: C.s5bg, fg: C.s5fg }].forEach(({ val, bg, fg }) => {
        wsRep.addConditionalFormatting({ ref: fCell, rules: [{ type: "cellIs", operator: "equal", formulae: [val], style: { fill: mkFill(bg), font: { name: "Segoe UI", bold: true, size: 11, color: { argb: fg } } } }] });
      });
      applyCell(wsRep.getCell(currentRow, 7), { value: { formula: `IF(${hideRow},"",5)` }, fill: C.offWhite, font: mkFont(C.mutedText, 9), align: mkAlign("center", "middle"), border: thinBorder });
      applyCell(wsRep.getCell(currentRow, 8), { value: { formula: `IF(${hideRow},"",IF(F${currentRow}="—","—",IF(OR(F${currentRow}="A",F${currentRow}="B"),50,IFERROR(F${currentRow}*20,"—"))))` }, fill: C.offWhite, font: { name: "Segoe UI", size: 9, bold: true, color: { argb: C.darkText } }, align: mkAlign("center", "middle"), border: thinBorder });
      const hCell = `H${currentRow}`;
      [{ val: 20, bg: C.s1bg, fg: C.s1fg }, { val: 40, bg: C.s2bg, fg: C.s2fg }, { val: 60, bg: C.s3bg, fg: C.s3fg }, { val: 80, bg: C.s4bg, fg: C.s4fg }, { val: 100, bg: C.s5bg, fg: C.s5fg }, { val: 50, bg: C.s3bg, fg: C.s3fg }].forEach(({ val, bg, fg }) => {
        wsRep.addConditionalFormatting({ ref: hCell, rules: [{ type: "cellIs", operator: "equal", formulae: [val], style: { fill: mkFill(bg), font: { name: "Segoe UI", bold: true, size: 9, color: { argb: fg } } } }] });
      });
      applyCell(wsRep.getCell(currentRow, 9), { value: { formula: `IF(${hideRow},"",IFERROR(XLOOKUP(TRIM(Home!$H$7)&"_"&${rdXL(seqN,"G")},Raw_Data!$A:$A,Raw_Data!$I:$I,"—"),"—"))` }, fill: isOdd ? C.altRow : C.white, font: mkFont(C.mutedText, 8, false), align: mkAlign("left", "middle", true), border: thinBorder });
      setHeight(currentRow, 36);
      currentRow++;
    }

    // Domain & Subdomain theming and hide-repeat
    const lastDataRow = currentRow - 1;
    if (lastDataRow >= DATA_START) {
      const domainRange = `A${DATA_START}:A${lastDataRow}`;
      const subdomainRange = `B${DATA_START}:B${lastDataRow}`;
      const domainThemes = {
        "Mindset & Adaptability": { bg: "FFE8F0FE", text: "FF1E3A8A" },
        "Psychological Health & Safety": { bg: "FFE6F9EE", text: "FF065F46" },
        "People Potential": { bg: "FFF5F0FF", text: "FF4C1D95" },
        "Relational & Emotional Intelligence": { bg: "FFFEF3C7", text: "FFB45309" }
      };
      for (const [domain, theme] of Object.entries(domainThemes)) {
        wsRep.addConditionalFormatting({
          ref: domainRange,
          rules: [{ type: "expression", formulae: [`=INDIRECT("A"&ROW())="${domain}"`], style: { fill: mkFill(theme.bg), font: { name: "Segoe UI", bold: true, size: 9, color: { argb: theme.text } } } }]
        });
        wsRep.addConditionalFormatting({
          ref: subdomainRange,
          rules: [{ type: "expression", formulae: [`=INDIRECT("A"&ROW())="${domain}"`], style: { fill: mkFill(theme.bg), font: { name: "Segoe UI", bold: false, size: 9, color: { argb: theme.text } } } }]
        });
      }
      // Hide duplicate Domain
      for (const [domain, theme] of Object.entries(domainThemes)) {
        wsRep.addConditionalFormatting({
          ref: `A${DATA_START + 1}:A${lastDataRow}`,
          rules: [{ type: "expression", formulae: [`=AND(INDIRECT("A"&ROW())=INDIRECT("A"&ROW()-1), INDIRECT("A"&ROW())="${domain}")`], style: { font: { color: { argb: theme.bg } } } }]
        });
      }
      // Hide duplicate Subdomain
      for (const [domain, theme] of Object.entries(domainThemes)) {
        wsRep.addConditionalFormatting({
          ref: `B${DATA_START + 1}:B${lastDataRow}`,
          rules: [{ type: "expression", formulae: [`=AND(INDIRECT("B"&ROW())=INDIRECT("B"&ROW()-1), INDIRECT("A"&ROW())=INDIRECT("A"&ROW()-1), INDIRECT("A"&ROW())="${domain}")`], style: { font: { color: { argb: theme.bg } } } }]
        });
      }
    }

    // Freeze panes on Report sheet
    wsRep.views = [{ state: "frozen", xSplit: 0, ySplit: 11, showGridLines: true, zoomScale: 90 }];
    if (currentRow > DATA_START) {
      wsRep.autoFilter = { from: { row: 11, column: 1 }, to: { row: currentRow - 1, column: 9 } };
    }

    // ------------------------- ALL DATA SHEET -------------------------
    const wsAll = workbook.addWorksheet("All Data", {
      views: [{ showGridLines: true, zoomScale: 85 }],
      pageSetup: { paperSize: 9, orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
    });
    wsAll.columns = [
      { key: "sno", width: 6 }, { key: "personName", width: 24 }, { key: "email", width: 28 },
      { key: "role", width: 14 }, { key: "department", width: 18 }, { key: "status", width: 14 },
      { key: "completedDate", width: 16 }, { key: "domain", width: 24 }, { key: "subdomain", width: 24 },
      { key: "questionCode", width: 14 }, { key: "questionStem", width: 55 }, { key: "questionType", width: 16 },
      { key: "yourScore", width: 12 }, { key: "maxScore", width: 10 }, { key: "pctScore", width: 10 },
      { key: "comment", width: 35 }
    ];
    wsAll.mergeCells("A1:P1");
    wsAll.getRow(1).height = 36;
    const allTitleCell = wsAll.getCell("A1");
    allTitleCell.value = `ALL DATA — ${orgName.toUpperCase()} — COMPLETE ORGANIZATION RESPONSES`;
    allTitleCell.fill = mkFill("FF0F2547");
    allTitleCell.font = { name: "Segoe UI", size: 14, bold: true, color: { argb: "FFFFFFFF" } };
    allTitleCell.alignment = { horizontal: "center", vertical: "middle" };
    wsAll.mergeCells("A2:L2");
    wsAll.getRow(2).height = 22;
    const allSubCell = wsAll.getCell("A2");
    allSubCell.value = `Total Participants: ${reportsData.length}  |  Completed: ${completedCount}  |  Pending: ${reportsData.length - completedCount}`;
    allSubCell.fill = mkFill("FF1A3A6B");
    allSubCell.font = mkFont("FFFFFFFF", 9, true);
    allSubCell.alignment = mkAlign("left", "middle");
    wsAll.mergeCells("M2:N2");
    const allNavHome = wsAll.getCell("M2");
    allNavHome.value = { text: "← HOME", hyperlink: "#'Home'!A1" };
    allNavHome.fill = mkFill("FFE8F0FE");
    allNavHome.font = { name: "Segoe UI", size: 9, bold: true, color: { argb: "FF0F2547" } };
    allNavHome.alignment = mkAlign("center", "middle");
    allNavHome.border = mkBorder("FFAAB8CC", "thin");
    wsAll.mergeCells("O2:P2");
    const allNavSummary = wsAll.getCell("O2");
    allNavSummary.value = { text: "SUMMARY →", hyperlink: "#'Summary'!A1" };
    allNavSummary.fill = mkFill("FFE6F9EE");
    allNavSummary.font = { name: "Segoe UI", size: 9, bold: true, color: { argb: "FF065F46" } };
    allNavSummary.alignment = mkAlign("center", "middle");
    allNavSummary.border = mkBorder("FFAAB8CC", "thin");
    wsAll.getRow(3).height = 6;

    const allHeaders = [
      "S.No", "Person Name", "Email", "Role", "Department", "Status",
      "Completed Date", "Domain", "Sub-Domain", "Question Code",
      "Question", "Question Type", "Score", "Max Score", "% Score", "Comments"
    ];
    allHeaders.forEach((h, i) => {
      const cell = wsAll.getCell(4, i + 1);
      cell.value = h;
      cell.fill = mkFill("FF0F2547");
      cell.font = mkFont("FFFFFFFF", 10, true);
      cell.alignment = mkAlign([4, 10, 11, 15].includes(i) ? "left" : "center", "middle");
      cell.border = mkBorder("FFAAB8CC", "medium");
    });
    wsAll.getRow(4).height = 32;

    const percentageMap = { 1: 20, 2: 40, 3: 60, 4: 80, 5: 100 };
    let allDataRow = 5;
    let sno = 1;
    const roleColors = { leader: { bg: "FFF5F0FF", text: "FF7C3AED" }, manager: { bg: "FFE6F9EE", text: "FF0E9F6E" }, employee: { bg: "FFE8F0FE", text: "FF1A56DB" } };
    const statusColorsAll = { completed: { bg: "FFD1FAE5", text: "FF047857" }, pending: { bg: "FFFEF3C7", text: "FFD97706" } };
    const getScoreColorAll = (score) => {
      if (score === null || score === undefined || score === "" || score === "—") return null;
      const n = typeof score === "number" ? score : Number(score);
      if (isNaN(n)) return null;
      if (n >= 4) return { bg: "FFD1FAE5", fg: "FF047857" };
      if (n >= 3) return { bg: "FFFEF3C7", fg: "FFD97706" };
      return { bg: "FFFEE2E2", fg: "FFDC2626" };
    };

    reportsData.forEach(report => {
      if (report.isCompleted && report.responses && report.responses.length > 0) {
        const completedDateStr = new Date(report.submittedAt).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
        report.responses.forEach(resp => {
          const isFc = resp.questionType === "Forced-Choice" || resp.scale === "FORCED_CHOICE";
          const rawScore = isFc ? (resp.selectedOption || "—") : ((resp.value !== null && resp.value !== undefined) ? Number(resp.value) : "—");
          const numericScore = (typeof rawScore === "number") ? rawScore : null;
          const pctVal = isFc ? 50 : (numericScore !== null ? (percentageMap[Math.round(numericScore)] || "—") : "—");
          const isOdd = (allDataRow % 2) !== 0;
          const roleLower = (report.role || "").toLowerCase();
          const roleClr = roleColors[roleLower] || { bg: "FFF8FAFC", text: "FF6B7A90" };
          const scClr = getScoreColorAll(rawScore);
          const rowValues = [
            sno, report.empName, report.email, report.role, report.dept, "Completed",
            completedDateStr, resp.domain, resp.subdomain, resp.questionCode,
            resp.questionStem || "—", resp.questionType || "—", rawScore, 5, pctVal, resp.comment || "—"
          ];
          rowValues.forEach((val, ci) => {
            const cell = wsAll.getCell(allDataRow, ci + 1);
            cell.value = val;
            cell.border = mkBorder();
            cell.font = mkFont("FF1E2A3B", 9);
            cell.fill = mkFill(isOdd ? "FFF4F6FA" : "FFFFFFFF");
            cell.alignment = mkAlign("center", "middle", ci >= 10);
            if (ci === 1 || ci === 2) { cell.alignment = mkAlign("left", "middle"); cell.font = mkFont("FF1E2A3B", 9, ci === 1); }
            if (ci === 3) { cell.fill = mkFill(roleClr.bg); cell.font = mkFont(roleClr.text, 9, true); }
            if (ci === 5) { cell.fill = mkFill(statusColorsAll.completed.bg); cell.font = mkFont(statusColorsAll.completed.text, 9, true); }
            if (ci === 7 || ci === 8) cell.alignment = mkAlign("left", "middle", true);
            if (ci === 10) cell.alignment = mkAlign("left", "middle", true);
            if (ci === 12 && scClr) { cell.fill = mkFill(scClr.bg); cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: scClr.fg } }; }
            if (ci === 14 && scClr) { cell.fill = mkFill(scClr.bg); cell.font = { name: "Segoe UI", size: 9, bold: true, color: { argb: scClr.fg } }; }
          });
          const stemLen = (resp.questionStem || "").length;
          wsAll.getRow(allDataRow).height = Math.max(22, Math.ceil(stemLen / 60) * 14);
          allDataRow++; sno++;
        });
      } else {
        const isOdd = (allDataRow % 2) !== 0;
        const roleLower = (report.role || "").toLowerCase();
        const roleClr = roleColors[roleLower] || { bg: "FFF8FAFC", text: "FF6B7A90" };
        const rowValues = [
          sno, report.empName, report.email, report.role, report.dept, "Pending",
          "—", "—", "—", "—", "—", "—", "—", "—", "—", "Assessment not submitted"
        ];
        rowValues.forEach((val, ci) => {
          const cell = wsAll.getCell(allDataRow, ci + 1);
          cell.value = val;
          cell.border = mkBorder();
          cell.font = mkFont("FF6B7A90", 9);
          cell.fill = mkFill(isOdd ? "FFF4F6FA" : "FFFFFFFF");
          cell.alignment = mkAlign("center", "middle");
          if (ci === 1 || ci === 2) cell.alignment = mkAlign("left", "middle");
          if (ci === 1) cell.font = mkFont("FF6B7A90", 9, true);
          if (ci === 3) { cell.fill = mkFill(roleClr.bg); cell.font = mkFont(roleClr.text, 9, true); }
          if (ci === 5) { cell.fill = mkFill(statusColorsAll.pending.bg); cell.font = mkFont(statusColorsAll.pending.text, 9, true); }
        });
        wsAll.getRow(allDataRow).height = 22;
        allDataRow++; sno++;
      }
    });
    if (allDataRow > 5) wsAll.autoFilter = { from: { row: 4, column: 1 }, to: { row: allDataRow - 1, column: 16 } };
    wsAll.views = [{ state: "frozen", xSplit: 2, ySplit: 4, showGridLines: true, zoomScale: 85 }];

    // ------------------------- SUMMARY SHEET -------------------------
    const wsSummary = workbook.addWorksheet("Summary", {
      views: [{ showGridLines: true, zoomScale: 90 }],
      pageSetup: { paperSize: 9, orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
    });
    const allDomains = [...new Set(sortedQuestions.map(q => q.domain).filter(Boolean))];
    const summaryFixedHeaders = ["S.No", "Person Name", "Email", "Role", "Department", "Status", "Completed Date", "Total Questions", "Avg Score", "% Avg", "Classification"];
    const summaryHeaders = [...summaryFixedHeaders, ...allDomains.map(d => `${d} Avg`)];
    const summaryColWidths = [6, 24, 28, 14, 18, 14, 16, 14, 12, 10, 14, ...allDomains.map(() => 18)];
    wsSummary.columns = summaryHeaders.map((_, i) => ({ width: summaryColWidths[i] || 16 }));
    const sumLastCol = summaryHeaders.length;
    wsSummary.mergeCells(1, 1, 1, sumLastCol);
    wsSummary.getRow(1).height = 36;
    const sumTitleCell = wsSummary.getCell("A1");
    sumTitleCell.value = `ORGANIZATION SUMMARY — ${orgName.toUpperCase()}`;
    sumTitleCell.fill = mkFill("FF0F2547");
    sumTitleCell.font = { name: "Segoe UI", size: 14, bold: true, color: { argb: "FFFFFFFF" } };
    sumTitleCell.alignment = mkAlign("center", "middle");
    const subLastCol = Math.max(sumLastCol - 4, 1);
    wsSummary.mergeCells(2, 1, 2, subLastCol);
    wsSummary.getRow(2).height = 22;
    const sumSubCell = wsSummary.getCell("A2");
    sumSubCell.value = `Per-Person Aggregation  |  Participants: ${reportsData.length}  |  Completed: ${completedCount}  |  Domains: ${allDomains.length}`;
    sumSubCell.fill = mkFill("FF1A3A6B");
    sumSubCell.font = mkFont("FFFFFFFF", 9, true);
    sumSubCell.alignment = mkAlign("left", "middle");
    const navStart = subLastCol + 1;
    const navMid = Math.min(navStart + 1, sumLastCol);
    const navEnd = Math.min(navMid + 1, sumLastCol);
    if (navStart <= sumLastCol) {
      wsSummary.mergeCells(2, navStart, 2, navMid);
      const sumNavHome = wsSummary.getCell(2, navStart);
      sumNavHome.value = { text: "← HOME", hyperlink: "#'Home'!A1" };
      sumNavHome.fill = mkFill("FFE8F0FE");
      sumNavHome.font = { name: "Segoe UI", size: 9, bold: true, color: { argb: "FF0F2547" } };
      sumNavHome.alignment = mkAlign("center", "middle");
      sumNavHome.border = mkBorder("FFAAB8CC", "thin");
    }
    if (navEnd <= sumLastCol) {
      wsSummary.mergeCells(2, navEnd, 2, sumLastCol);
      const sumNavAll = wsSummary.getCell(2, navEnd);
      sumNavAll.value = { text: "ALL DATA →", hyperlink: "#'All Data'!A1" };
      sumNavAll.fill = mkFill("FFF5F0FF");
      sumNavAll.font = { name: "Segoe UI", size: 9, bold: true, color: { argb: "FF7C3AED" } };
      sumNavAll.alignment = mkAlign("center", "middle");
      sumNavAll.border = mkBorder("FFAAB8CC", "thin");
    }
    wsSummary.getRow(3).height = 6;
    summaryHeaders.forEach((h, i) => {
      const cell = wsSummary.getCell(4, i + 1);
      cell.value = h;
      cell.fill = mkFill("FF0F2547");
      cell.font = mkFont("FFFFFFFF", 10, true);
      cell.alignment = mkAlign("center", "middle", true);
      cell.border = mkBorder("FFAAB8CC", "medium");
    });
    wsSummary.getRow(4).height = 36;
    let sumRow = 5;
    let sumSno = 1;
    reportsData.forEach(report => {
      const isOdd = (sumRow % 2) !== 0;
      const roleLower = (report.role || "").toLowerCase();
      const roleClr = roleColors[roleLower] || { bg: "FFF8FAFC", text: "FF6B7A90" };
      const domainScores = {};
      allDomains.forEach(d => { domainScores[d] = { sum: 0, count: 0 }; });
      let totalScore = 0, totalRated = 0;
      if (report.isCompleted && report.responses) {
        report.responses.forEach(resp => {
          const isFc = resp.questionType === "Forced-Choice" || resp.scale === "FORCED_CHOICE";
          let score = null;
          if (isFc) score = 2.5;
          else if (resp.value !== null && resp.value !== undefined) score = Number(resp.value);
          if (score !== null && !isNaN(score)) {
            totalScore += score;
            totalRated++;
            if (resp.domain && domainScores[resp.domain]) {
              domainScores[resp.domain].sum += score;
              domainScores[resp.domain].count++;
            }
          }
        });
      }
      const avgScore = totalRated > 0 ? (totalScore / totalRated) : null;
      const pctAvg = avgScore !== null ? Math.round((avgScore / 5) * 100) : null;
      const classification = avgScore !== null ? (avgScore >= 4 ? "High" : avgScore >= 2.5 ? "Medium" : "Low") : "—";
      const completedDateStr = report.isCompleted && report.submittedAt ? new Date(report.submittedAt).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" }) : "—";
      const status = report.isCompleted ? "Completed" : "Pending";
      const totalQ = report.isCompleted ? (report.responses || []).length : 0;
      const fixedValues = [sumSno, report.empName, report.email, report.role, report.dept, status, completedDateStr, totalQ, avgScore !== null ? Math.round(avgScore * 100) / 100 : "—", pctAvg !== null ? pctAvg : "—", classification];
      const domainValues = allDomains.map(d => { const ds = domainScores[d]; return ds.count > 0 ? Math.round((ds.sum / ds.count) * 100) / 100 : "—"; });
      const allValues = [...fixedValues, ...domainValues];
      allValues.forEach((val, ci) => {
        const cell = wsSummary.getCell(sumRow, ci + 1);
        cell.value = val;
        cell.border = mkBorder();
        cell.font = mkFont("FF1E2A3B", 9);
        cell.fill = mkFill(isOdd ? "FFF4F6FA" : "FFFFFFFF");
        cell.alignment = mkAlign("center", "middle", ci >= summaryFixedHeaders.length);
        if (ci === 1 || ci === 2) { cell.alignment = mkAlign("left", "middle"); cell.font = mkFont("FF1E2A3B", 9, ci === 1); }
        if (ci === 3) { cell.fill = mkFill(roleClr.bg); cell.font = mkFont(roleClr.text, 9, true); }
        if (ci === 5) { const sc = status === "Completed" ? statusColorsAll.completed : statusColorsAll.pending; cell.fill = mkFill(sc.bg); cell.font = mkFont(sc.text, 9, true); }
        if (ci === 8 || ci === 9) { const scoreClr = getScoreColorAll(val); if (scoreClr) { cell.fill = mkFill(scoreClr.bg); cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: scoreClr.fg } }; } }
        if (ci === 10) {
          const classClr = classification === "High" ? { bg: "FFD1FAE5", text: "FF047857" } : classification === "Medium" ? { bg: "FFFEF3C7", text: "FFD97706" } : classification === "Low" ? { bg: "FFFEE2E2", text: "FFDC2626" } : null;
          if (classClr) { cell.fill = mkFill(classClr.bg); cell.font = mkFont(classClr.text, 9, true); }
        }
        if (ci >= summaryFixedHeaders.length) { const scoreClr = getScoreColorAll(val); if (scoreClr) { cell.fill = mkFill(scoreClr.bg); cell.font = { name: "Segoe UI", size: 9, bold: true, color: { argb: scoreClr.fg } }; } }
      });
      wsSummary.getRow(sumRow).height = 24;
      sumRow++; sumSno++;
    });
    if (sumRow > 5) {
      const grandRow = sumRow + 1;
      wsSummary.mergeCells(grandRow, 1, grandRow, 2);
      const grandCell = wsSummary.getCell(grandRow, 1);
      grandCell.value = "GRAND TOTALS";
      grandCell.fill = mkFill("FF0F2547");
      grandCell.font = mkFont("FFFFFFFF", 10, true);
      grandCell.alignment = mkAlign("center", "middle");
      grandCell.border = mkBorder("FFAAB8CC", "medium");
      for (let c = 3; c <= 7; c++) { const cell = wsSummary.getCell(grandRow, c); cell.fill = mkFill("FF1A3A6B"); cell.border = mkBorder("FFAAB8CC", "medium"); }
      const tqCell = wsSummary.getCell(grandRow, 8);
      tqCell.value = { formula: `SUM(H5:H${sumRow - 1})` };
      tqCell.fill = mkFill("FF1A3A6B");
      tqCell.font = mkFont("FFFFFFFF", 10, true);
      tqCell.alignment = mkAlign("center", "middle");
      tqCell.border = mkBorder("FFAAB8CC", "medium");
      const avgCell = wsSummary.getCell(grandRow, 9);
      avgCell.value = { formula: `IFERROR(AVERAGE(I5:I${sumRow - 1}), "—")` };
      avgCell.fill = mkFill("FF1A3A6B");
      avgCell.font = mkFont("FFFFFFFF", 10, true);
      avgCell.alignment = mkAlign("center", "middle");
      avgCell.border = mkBorder("FFAAB8CC", "medium");
      const pctCell = wsSummary.getCell(grandRow, 10);
      pctCell.value = { formula: `IFERROR(AVERAGE(J5:J${sumRow - 1}), "—")` };
      pctCell.fill = mkFill("FF1A3A6B");
      pctCell.font = mkFont("FFFFFFFF", 10, true);
      pctCell.alignment = mkAlign("center", "middle");
      pctCell.border = mkBorder("FFAAB8CC", "medium");
      const clsCell = wsSummary.getCell(grandRow, 11);
      clsCell.fill = mkFill("FF1A3A6B");
      clsCell.border = mkBorder("FFAAB8CC", "medium");
      allDomains.forEach((_, di) => {
        const colIdx = summaryFixedHeaders.length + di + 1;
        const dCell = wsSummary.getCell(grandRow, colIdx);
        dCell.value = { formula: `IFERROR(AVERAGE(INDIRECT("R5C${colIdx}:R${sumRow - 1}C${colIdx}", FALSE)), "—")` };
        dCell.fill = mkFill("FF1A3A6B");
        dCell.font = mkFont("FFFFFFFF", 9, true);
        dCell.alignment = mkAlign("center", "middle");
        dCell.border = mkBorder("FFAAB8CC", "medium");
      });
      wsSummary.getRow(grandRow).height = 28;
    }
    if (sumRow > 5) wsSummary.autoFilter = { from: { row: 4, column: 1 }, to: { row: sumRow - 1, column: summaryHeaders.length } };
    wsSummary.views = [{ state: "frozen", xSplit: 2, ySplit: 4, showGridLines: true, zoomScale: 90 }];

    // Auto-filter on Raw_Data
    const rawLastRow = wsRaw.lastRow ? wsRaw.lastRow.number : 1;
    if (rawLastRow > 1) wsRaw.autoFilter = { from: { row: 1, column: 1 }, to: { row: rawLastRow, column: 14 } };

    // Send file
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=Organization_Report_${orgName.replace(/\s+/g, "_")}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error("Error generating organization Excel report:", error);
    res.status(500).json({ message: "Error generating Excel report", error: error.message });
  }
};