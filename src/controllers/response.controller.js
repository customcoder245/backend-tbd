import Response from "../models/response.model.js";
import Question from "../models/question.model.js";

/**
 * SAVE RESPONSE (Autosave)
 */
export const saveResponse = async (req, res) => {
  try {
    const responses = req.body.responses;
    console.log("Received responses:", responses);

    if (!Array.isArray(responses) || responses.length === 0) {
      return res.status(400).json({ message: "Invalid response data" });
    }

    const savedResponses = [];
    for (let response of responses) {
      const { assessmentId, questionId, questionCode, answer, comment } = response;

      if (!assessmentId || !questionId || !questionCode || answer === undefined) {
        return res.status(400).json({ message: "Invalid response data" });
      }

      const question = await Question.findById(questionId);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }

      let finalComment = comment;
      
      // DYNAMIC LOGIC STARTS HERE
      if (question.scale === "SCALE_1_5" || question.questionType === "Calibration") {
        if (answer <= 3 && !comment?.trim()) {
          return res.status(400).json({ message: "Comment is required for answers <= 3" });
        } else if (answer > 3) {
          finalComment = null;
        }
      } 
      else if (question.scale === "FORCED_CHOICE") {
        // We get the specific higher value for THIS question (could be A or B)
        const hvOption = question.forcedChoice?.higherValueOption; 

        if (answer === hvOption && !comment?.trim()) {
          return res.status(400).json({ 
            message: `Comment is required for higher value option (${hvOption})` 
          });
        } else if (answer !== hvOption) {
          // If they picked the lower value option, we clear the comment
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
