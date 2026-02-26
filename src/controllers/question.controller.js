import Question from "../models/question.model.js";

const domainAbbr = {
  "People Potential": "PP",
  "Operational Steadiness": "OS",
  "Digital Fluency": "DF"
};

const stakeholderPrefix = {
  "admin": "A",
  "leader": "L",
  "manager": "M",
  "employee": "E"
};

const typeSuffix = {
  "Calibration": "CAL",
  "Behavioural": "B",
  "Forced-Choice": "FC",
  "Self-Rating": ""
};

const getAbbreviation = (text) => {
  if (!text) return "";
  return text
    .split(/[\s&/-]+/)
    .filter(word => word.length > 0 && !["and", "the", "with", "or"].includes(word.toLowerCase()))
    .map(word => word[0].toUpperCase())
    .join("");
};

const generateQuestionCode = async (stakeholder, domain, subdomain, questionType, offset = 0) => {
  const dAbbr = domainAbbr[domain] || getAbbreviation(domain);
  const sAbbr = getAbbreviation(subdomain);
  const rolePref = stakeholderPrefix[stakeholder.toLowerCase()] || (stakeholder ? stakeholder[0].toUpperCase() : "X");
  const tSuff = typeSuffix[questionType] || "";

  const prefix = `${dAbbr}-${sAbbr}-${rolePref}${tSuff}`;

  // Find questions with this prefix to get the next number
  const regex = new RegExp(`^${prefix}(\\d+)$`);
  const questions = await Question.find({ questionCode: regex }, { questionCode: 1 }).lean();

  let maxNum = 0;
  questions.forEach(q => {
    const match = q.questionCode.match(regex);
    if (match) {
      const num = parseInt(match[1]);
      if (num > maxNum) maxNum = num;
    }
  });

  return `${prefix}${maxNum + 1 + offset}`;
};

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

    // List of created questions
    const createdQuestions = [];

    // 1. Pre-calculate the base max numbers from DB for all prefixes in this batch
    const prefixBaseMax = {};
    for (const key in questions) {
      const q = questions[key];
      const dAbbr = domainAbbr[q.domain] || getAbbreviation(q.domain);
      const sAbbr = getAbbreviation(q.subdomain);
      const rolePref = stakeholderPrefix[q.stakeholder.toLowerCase()] || (q.stakeholder ? q.stakeholder[0].toUpperCase() : "X");
      const tSuff = typeSuffix[q.questionType] || "";
      const prefix = `${dAbbr}-${sAbbr}-${rolePref}${tSuff}`;

      if (prefixBaseMax[prefix] === undefined) {
        const regex = new RegExp(`^${prefix}(\\d+)$`);
        const existingDocs = await Question.find({ questionCode: regex }, { questionCode: 1 }).lean();
        let maxOfPrefix = 0;
        existingDocs.forEach(doc => {
          const match = doc.questionCode.match(regex);
          if (match) {
            const num = parseInt(match[1]);
            if (num > maxOfPrefix) maxOfPrefix = num;
          }
        });
        prefixBaseMax[prefix] = maxOfPrefix;
      }
    }

    // 2. Track counts for the current batch
    const batchPrefixCounts = {};

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

        // Auto-generate unique Prefix for tracking in this batch
        const dAbbr = domainAbbr[domain] || getAbbreviation(domain);
        const sAbbr = getAbbreviation(subdomain);
        const rolePref = stakeholderPrefix[stakeholder.toLowerCase()] || (stakeholder ? stakeholder[0].toUpperCase() : "X");
        const tSuff = typeSuffix[questionType] || "";
        const prefix = `${dAbbr}-${sAbbr}-${rolePref}${tSuff}`;

        // Use count in batch to calculate unique code
        const countInBatch = batchPrefixCounts[prefix] || 0;
        batchPrefixCounts[prefix] = countInBatch + 1;

        // Final Code = Base found in DB at start + Count in current batch + 1
        const generatedCode = `${prefix}${prefixBaseMax[prefix] + countInBatch + 1}`;

        // Prevent duplicate questionCode (double check)
        const existingCode = await Question.findOne({ questionCode: generatedCode });
        if (existingCode) {
          return res.status(409).json({
            message: `Question with code ${generatedCode} already exists`
          });
        }

        // Create the new question with the calculated subdomainWeight
        const question = new Question({
          stakeholder,
          domain,
          subdomain,
          questionType,
          questionCode: generatedCode,
          questionStem,
          scale,
          insightPrompt: scale === "FORCED_CHOICE" ? null : insightPrompt,
          forcedChoice: scale === "FORCED_CHOICE" ? forcedChoice : null,
          subdomainWeight: (domain === "People Potential" ? 0.35 : (domain === "Operational Steadiness" ? 0.25 : 0.20))
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

    const oldQuestion = await Question.findById(id);
    if (!oldQuestion) {
      return res.status(404).json({ message: "Question not found" });
    }

    // Re-generate questionCode if questionType changes
    let generatedCode = oldQuestion.questionCode;
    if (questionType && questionType !== oldQuestion.questionType) {
      generatedCode = await generateQuestionCode(
        oldQuestion.stakeholder,
        oldQuestion.domain,
        oldQuestion.subdomain,
        questionType
      );
    }

    const updatedQuestion = await Question.findByIdAndUpdate(
      id,
      {
        questionType,
        questionStem,
        scale,
        questionCode: generatedCode,
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
    }).sort({ order: 1 }); // Sort by order for the quiz

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

/**
 * GET ALL QUESTIONS WITH FILTERS (Admin/CRUD)
 * Supports filtering by stakeholder, domain, and subdomain
 */
export const getAllQuestions = async (req, res) => {
  try {
    const { stakeholder, domain, subdomain } = req.query;

    // Build filter object
    const filter = { isDeleted: false };

    if (stakeholder) {
      filter.stakeholder = stakeholder;
    }

    if (domain) {
      filter.domain = domain;
    }

    if (subdomain) {
      filter.subdomain = subdomain;
    }

    const questions = await Question.find(filter).sort({ stakeholder: 1, order: 1 }); // Sort by stakeholder and then order

    return res.status(200).json({
      success: true,
      data: questions,
      count: questions.length
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching questions",
      error: error.message
    });
  }
};

/**
 * GET SINGLE QUESTION BY ID (Admin/CRUD)
 */
export const getQuestionById = async (req, res) => {
  try {
    const { id } = req.params;

    const question = await Question.findById(id);

    if (!question || question.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Question not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: question
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching question",
      error: error.message
    });
  }
};

/**
 * BATCH REORDER QUESTIONS (Admin Drag & Drop)
 * req.body expects: [{ id: "...", order: 1 }, { id: "...", order: 2 }, ...]
 */
export const reorderQuestions = async (req, res) => {
  try {
    const updates = req.body;

    if (!Array.isArray(updates)) {
      return res.status(400).json({ message: "Updates must be an array of {id, order} objects" });
    }

    const bulkOps = updates.map(update => ({
      updateOne: {
        filter: { _id: update.id },
        update: { $set: { order: update.order } }
      }
    }));

    await Question.bulkWrite(bulkOps);

    return res.status(200).json({
      message: "Questions reordered successfully"
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error reordering questions",
      error: error.message
    });
  }
};