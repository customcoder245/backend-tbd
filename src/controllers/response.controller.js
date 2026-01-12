import Response from "../models/response.model.js";
import Question from "../models/question.model.js";

/**
 * SAVE RESPONSE (Autosave)
 */
export const saveResponse = async (req, res) => {
  try {
    const responses = req.body.responses;
    console.log("Received responses:", responses); // Log the received responses

    if (!Array.isArray(responses) || responses.length === 0) {
      return res.status(400).json({ message: "Invalid response data" });
    }

    const savedResponses = [];
    for (let response of responses) {
      console.log("Saving response:", response); // Log each response before saving

      const { assessmentId, questionId, questionCode, answer, comment } = response;

      if (!assessmentId || !questionId || !questionCode || answer === undefined) {
        return res.status(400).json({ message: "Invalid response data" });
      }

      // Fetch the question to get additional details
      const question = await Question.findById(questionId);

      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }

      // Determine the comment logic based on the question type
      let finalComment = comment;
      if (question.scale === "SCALE_1_5") {
        if (answer <= 3 && !comment) {
          return res.status(400).json({ message: "Comment is required for answers <= 3" });
        } else if (answer > 3) {
          finalComment = null;
        }
      } else if (question.scale === "FORCED_CHOICE") {
        if (answer === "A" && !comment) {
          return res.status(400).json({ message: "Comment is required for higher value option (A)" });
        } else if (answer === "B") {
          finalComment = null;
        }
      } else if (question.questionType === "Calibration") {
        if (answer <= 3 && !comment) {
          return res.status(400).json({ message: "Comment is required for answers <= 3" });
        } else if (answer > 3) {
          finalComment = null;
        }
      }

      // Save the response in the database (this can be saved in your Response model or wherever appropriate)
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
        value: typeof answer === "number" ? answer : null,  // For number-based answers
        selectedOption: typeof answer === "string" ? answer : null,  // For option-based answers
        higherValueOption: question.forcedChoice?.higherValueOption || null,
        valueDirection: question.forcedChoice?.higherValueOption
          ? answer === question.forcedChoice.higherValueOption
            ? "HIGHER"
            : "LOWER"
          : null,
        comment: finalComment,
        subdomainWeight: question.subdomainWeight
      };

      const savedResponse = await Response.findOneAndUpdate(
        { assessmentId, questionId },
        { ...fullResponseData },
        { upsert: true, new: true }
      );

      savedResponses.push(savedResponse);
    }

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
