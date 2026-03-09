import Response from "../models/response.model.js";
import Question from "../models/question.model.js";

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
        const hvOption = question.forcedChoice?.higherValueOption;

        if (answer === hvOption && !comment?.trim()) {
          return res.status(400).json({
            message: `Comment is required for higher value option (${hvOption})`
          });
        } else if (answer !== hvOption) {
          finalComment = null;
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

    const responses = await Response.find({ assessmentId });

    if (!responses.length) {
      return res.status(404).json({ message: "No responses found for this assessment" });
    }

    res.status(200).json(responses);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching responses",
      error: error.message
    });
  }
};
