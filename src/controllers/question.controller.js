import Question from "../models/question.model.js";

/**
 * CREATE QUESTION (Admin)
 */
// export const createQuestion = async (req, res) => {
//   try {
//     const {
//       stakeholder,
//       domain,
//       subdomain,
//       questionType,
//       questionCode,
//       questionStem,
//       scale,
//       insightPrompt,
//       forcedChoice
//     } = req.body;

//     // Common required fields validation
//     if (
//       !stakeholder ||
//       !domain ||
//       !subdomain ||
//       !questionType ||
//       !questionCode ||
//       !questionStem ||
//       !scale
//     ) {
//       return res.status(400).json({
//         message: "All required fields must be provided"
//       });
//     }

//     // Scale-specific validation
//     if (scale === "FORCED_CHOICE") {
//       if (
//         !forcedChoice ||
//         !forcedChoice.optionA?.label ||
//         !forcedChoice.optionA?.insightPrompt ||
//         !forcedChoice.optionB?.label ||
//         !forcedChoice.optionB?.insightPrompt ||
//         !forcedChoice.higherValueOption
//       ) {
//         return res.status(400).json({
//           message:
//             "Forced choice questions require optionA, optionB, and higherValueOption"
//         });
//       }
//     } else {
//       if (!insightPrompt) {
//         return res.status(400).json({
//           message: "Insight prompt is required for non-forced-choice questions"
//         });
//       }
//     }

//     // Prevent duplicate questionCode
//     const existingCode = await Question.findOne({ questionCode });
//     // const existingQuestion  = await Question.findOne({ questionStem });
//     // if (existingCode && !existingQuestion || !existingCode && existingQuestion) {
//     //   return res.status(409).json({
//     //     message: "Question with this questionCode or QuesitonStem already exists "
//     //   });
//     // }

//     if (existingCode) {
//       return res.status(409).json({
//         message: "Question with this questionCode or QuesitonStem already exists "
//       });
//     }

//     // Calculate subdomainWeight based on the domain
//     let subdomainWeight = 0;

//     const subdomainWeights = {
//       "People Potential": 0.35,
//       "Operational Steadiness": 0.25,
//       "Digital Fluency": 0.20
//     };

//     // Assign the weight based on domain
//     if (subdomainWeights[domain]) {
//       subdomainWeight = subdomainWeights[domain];
//     }

//     // Create the new question with the calculated subdomainWeight
//     const question = new Question({
//       stakeholder,
//       domain,
//       subdomain,
//       questionType,
//       questionCode,
//       questionStem,
//       scale,
//       insightPrompt: scale === "FORCED_CHOICE" ? null : insightPrompt,
//       forcedChoice: scale === "FORCED_CHOICE" ? forcedChoice : null,
//       subdomainWeight // Set the calculated subdomainWeight
//     });

//     // Save the question to the database
//     const savedQuestion = await question.save();

//     return res.status(201).json({
//       message: "Question created successfully",
//       data: savedQuestion
//     });
//   } catch (error) {
//     return res.status(500).json({
//       message: "Error creating question",
//       error: error.message
//     });
//   }
// };

/**
 * CREATE MULTIPLE QUESTIONS (Admin)
 */
export const createMultipleQuestions = async (req, res) => {
  try {
    const questions = req.body; // The request body is now an object, not an array

    // Ensure questions are provided
    if (Object.keys(questions).length === 0) {
      return res.status(400).json({
        message: "An object of questions must be provided"
      });
    }

    // Ensure that all questions belong to the same stakeholder
    const stakeholder = questions[Object.keys(questions)[0]].stakeholder; // Get the stakeholder from the first question
    const allSameStakeholder = Object.values(questions).every((question) => question.stakeholder === stakeholder);

    if (!allSameStakeholder) {
      return res.status(400).json({
        message: "All questions must belong to the same stakeholder"
      });
    }

    // Array to store created questions
    const createdQuestions = [];

    // Iterate over the object of questions
    for (const key in questions) {
      if (questions.hasOwnProperty(key)) {
        const questionData = questions[key];
        const {
          stakeholder,
          domain,
          subdomain,
          questionType,
          questionCode,
          questionStem,
          scale,
          insightPrompt,
          forcedChoice
        } = questionData;

        // Common required fields validation
        if (
          !stakeholder ||
          !domain ||
          !subdomain ||
          !questionType ||
          !questionCode ||
          !questionStem ||
          !scale
        ) {
          return res.status(400).json({
            message: "All required fields must be provided"
          });
        }

        // Scale-specific validation
        if (scale === "FORCED_CHOICE") {
          if (
            !forcedChoice ||
            !forcedChoice.optionA?.label ||
            !forcedChoice.optionA?.insightPrompt ||
            !forcedChoice.optionB?.label ||
            !forcedChoice.optionB?.insightPrompt ||
            !forcedChoice.higherValueOption
          ) {
            return res.status(400).json({
              message: "Forced choice questions require optionA, optionB, and higherValueOption"
            });
          }
        } else {
          if (!insightPrompt) {
            return res.status(400).json({
              message: "Insight prompt is required for non-forced-choice questions"
            });
          }
        }

        // Prevent duplicate questionCode
        const existingCode = await Question.findOne({ questionCode });
        if (existingCode) {
          return res.status(409).json({
            message: "Question with this questionCode already exists"
          });
        }

        // Calculate subdomainWeight based on the domain
        let subdomainWeight = 0;

        const subdomainWeights = {
          "People Potential": 0.35,
          "Operational Steadiness": 0.25,
          "Digital Fluency": 0.20
        };

        // Assign the weight based on domain
        if (subdomainWeights[domain]) {
          subdomainWeight = subdomainWeights[domain];
        }

        // Create the new question with the calculated subdomainWeight
        const question = new Question({
          stakeholder,
          domain,
          subdomain,
          questionType,
          questionCode,
          questionStem,
          scale,
          insightPrompt: scale === "FORCED_CHOICE" ? null : insightPrompt,
          forcedChoice: scale === "FORCED_CHOICE" ? forcedChoice : null,
          subdomainWeight // Set the calculated subdomainWeight
        });

        // Save the question to the database
        const savedQuestion = await question.save();
        createdQuestions.push(savedQuestion); // Add the created question to the list
      }
    }

    return res.status(201).json({
      message: "Questions created successfully",
      data: createdQuestions
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error creating questions",
      error: error.message
    });
  }
};

/**
 * UPDATE QUESTION (Admin)
 * Only editable fields are allowed
 */
export const updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      questionType,
      questionStem,
      scale,
      insightPrompt,
      forcedChoice
    } = req.body;

    // Required editable fields
    if (!questionType || !questionStem || !scale) {
      return res.status(400).json({
        message: "All editable fields must be provided"
      });
    }

    // Scale-specific validation
    if (scale === "FORCED_CHOICE") {
      if (
        !forcedChoice ||
        !forcedChoice.optionA?.label ||
        !forcedChoice.optionA?.insightPrompt ||
        !forcedChoice.optionB?.label ||
        !forcedChoice.optionB?.insightPrompt ||
        !forcedChoice.higherValueOption
      ) {
        return res.status(400).json({
          message: "Forced choice questions require complete forcedChoice data"
        });
      }
    } else {
      if (!insightPrompt) {
        return res.status(400).json({
          message: "Insight prompt is required for non-forced-choice questions"
        });
      }
    }

    const updatedQuestion = await Question.findByIdAndUpdate(
      id,
      {
        questionType,
        questionStem,
        scale,
        insightPrompt: scale === "FORCED_CHOICE" ? null : insightPrompt,
        forcedChoice: scale === "FORCED_CHOICE" ? forcedChoice : null
      },
      { new: true, runValidators: true }
    );

    if (!updatedQuestion) {
      return res.status(404).json({
        message: "Question not found"
      });
    }

    return res.status(200).json({
      message: "Question updated successfully",
      data: updatedQuestion
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error updating question",
      error: error.message
    });
  }
};

/**
 * SOFT DELETE QUESTION (Admin)
 */
export const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedQuestion = await Question.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );

    if (!deletedQuestion) {
      return res.status(404).json({
        message: "Question not found"
      });
    }

    return res.status(200).json({
      message: "Question deleted successfully"
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error deleting question",
      error: error.message
    });
  }
};

/**
 * GET QUESTIONS BY STAKEHOLDER (Assessment)
 */
export const getQuestionsByStakeholder = async (req, res) => {
  try {
    const { stakeholder } = req.query;

    if (!stakeholder) {
      return res.status(400).json({
        message: "Stakeholder is required"
      });
    }

    const questions = await Question.find({
      stakeholder,
      isDeleted: false
    });

    return res.status(200).json({
      data: questions
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching questions",
      error: error.message
    });
  }
};
