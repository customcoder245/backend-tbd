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

const generateQuestionCode = async (stakeholder, domain, subdomain, questionType, orgName = null, offset = 0) => {
  const dAbbr = domainAbbr[domain] || getAbbreviation(domain);
  const sAbbr = getAbbreviation(subdomain);
  const rolePref = stakeholderPrefix[stakeholder.toLowerCase()] || (stakeholder ? stakeholder[0].toUpperCase() : "X");
  const tSuff = typeSuffix[questionType] || "";

  const prefix = `${dAbbr}-${sAbbr}-${rolePref}${tSuff}`;

  // Find questions with this prefix to get the next number within the organization
  const regex = new RegExp(`^${prefix}(\\d+)$`);
  const questions = await Question.find({ questionCode: regex, orgName }, { questionCode: 1 }).lean();

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
    const role = req.user.role?.toLowerCase();
    const userOrg = req.user.orgName;
    let orgName = (role === "superadmin" && req.body.orgName !== undefined) ? req.body.orgName : userOrg;
    if (orgName === "") orgName = null; // Normalize empty string to null for Master Template
    const questions = req.body.questions || req.body;

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
        const existingDocs = await Question.find({ questionCode: regex, orgName }, { questionCode: 1 }).lean();
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
    const maxOrderPerSubdomain = {}; // Tracks { "stakeholder-subdomain": maxOrder }

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

        // Prevent duplicate questionCode within the same organization
        const existingCode = await Question.findOne({ questionCode: generatedCode, orgName });
        if (existingCode) {
          return res.status(409).json({
            message: `Question with code ${generatedCode} already exists`
          });
        }

        // Get Max Order for stakeholder and subdomain safely
        const orderKey = `${stakeholder}-${subdomain}`;
        if (maxOrderPerSubdomain[orderKey] === undefined) {
          const highestOrderQuestion = await Question.findOne({
            stakeholder,
            subdomain,
            orgName,
            isDeleted: false
          }).sort('-order').lean();
          maxOrderPerSubdomain[orderKey] = highestOrderQuestion && highestOrderQuestion.order != null ? highestOrderQuestion.order : 0;
        }
        maxOrderPerSubdomain[orderKey] += 1;

        // Create the new question with the calculated subdomainWeight and append to the end
        const question = new Question({
          stakeholder,
          domain,
          subdomain,
          questionType,
          questionCode: generatedCode,
          orgName,
          questionStem,
          scale,
          insightPrompt: scale === "FORCED_CHOICE" ? null : insightPrompt,
          forcedChoice: scale === "FORCED_CHOICE" ? forcedChoice : null,
          subdomainWeight: (domain === "People Potential" ? 0.35 : (domain === "Operational Steadiness" ? 0.25 : 0.20)),
          order: maxOrderPerSubdomain[orderKey]
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
 * CLONE MASTER TEMPLATE TO ORGANIZATION (SuperAdmin/Admin)
 */
export const cloneTemplate = async (req, res) => {
  try {
    const role = req.user.role?.toLowerCase();
    const userOrg = req.user.orgName;
    let targetOrg = (role === "superadmin" && req.body.orgName !== undefined) ? req.body.orgName : userOrg;

    if (!targetOrg) {
      return res.status(400).json({ success: false, message: "Organization name is required." });
    }

    // 1. Check if already initialized
    const existingCount = await Question.countDocuments({ orgName: targetOrg });
    if (existingCount > 0) {
      return res.status(400).json({ success: false, message: `Organization "${targetOrg}" already has questions. Clone aborted.` });
    }

    // 2. Fetch masters
    const masters = await Question.find({
      $or: [{ orgName: null }, { orgName: "" }, { orgName: { $exists: false } }],
      isDeleted: false
    }).lean();

    if (masters.length === 0) {
      return res.status(404).json({ success: false, message: "Master template is empty." });
    }

    // 3. Map to new organization
    const seen = new Set();
    const tenantQuestions = [];

    masters.forEach(mq => {
      const qCode = mq.questionCode;
      const qStakeholder = mq.stakeholder || "unknown";
      const key = `${qCode}-${qStakeholder}`;

      if (!qCode || seen.has(key)) return;
      seen.add(key);

      const qObj = { ...mq };
      delete qObj._id;
      delete qObj.__v;
      delete qObj.createdAt;
      delete qObj.updatedAt;
      qObj.orgName = targetOrg;
      tenantQuestions.push(qObj);
    });

    if (tenantQuestions.length === 0) {
      return res.status(404).json({ success: false, message: "No valid questions found to clone." });
    }

    // 4. Batch insert using Mongoose (Restored original logic pattern but made it robust)
    try {
      const result = await Question.insertMany(tenantQuestions, {
        ordered: false, // Ensure that if one fail, others still go through
        validateBeforeSave: false // Speed up and prevent schema mismatches
      });

      return res.status(200).json({
        success: true,
        message: `Successfully initialized ${targetOrg} with ${result.length} questions.`,
        count: result.length
      });
    } catch (error) {
      // If some questions were already there, we might get a partial success
      const finalCount = await Question.countDocuments({ orgName: targetOrg });
      if (finalCount > 0) {
        return res.status(200).json({
          success: true,
          message: `Organization ${targetOrg} initialized.`,
          count: finalCount
        });
      }
      throw error;
    }
  } catch (error) {
    console.error("Clone Error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred during organization initialization.",
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
      forcedChoice,
      order // Added order to allowed fields
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

    const role = req.user.role?.toLowerCase();
    const userOrg = req.user.orgName;
    const queryOrgName = req.query.orgName !== undefined ? req.query.orgName : req.body.orgName;
    let orgName = (role === "superadmin" && queryOrgName !== undefined) ? queryOrgName : userOrg;
    if (orgName === "") orgName = null;

    const orgFilter = (orgName === null || orgName === "")
      ? { $or: [{ orgName: null }, { orgName: { $exists: false } }, { orgName: "" }] }
      : { orgName };

    console.log(`updateQuestion: id=${id}, orgName=${orgName}, filter=${JSON.stringify(orgFilter)}`);

    const oldQuestion = await Question.findOne({ _id: id, ...orgFilter });
    if (!oldQuestion) {
      console.error(`updateQuestion: Question not found for id=${id} and filter=${JSON.stringify(orgFilter)}`);
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

    const updatedQuestion = await Question.findOneAndUpdate(
      { _id: id, ...orgFilter },
      {
        questionType,
        questionStem,
        scale,
        questionCode: generatedCode,
        insightPrompt: scale === "FORCED_CHOICE" ? null : insightPrompt,
        forcedChoice: scale === "FORCED_CHOICE" ? forcedChoice : null,
        order: order !== undefined ? Number(order) : oldQuestion.order // Update order if provided
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

    const role = req.user.role?.toLowerCase();
    const userOrg = req.user.orgName;
    let orgName = (role === "superadmin" && req.query.orgName !== undefined) ? req.query.orgName : userOrg;
    if (orgName === "") orgName = null;

    const orgFilter = (orgName === null || orgName === "")
      ? { $or: [{ orgName: null }, { orgName: { $exists: false } }, { orgName: "" }] }
      : { orgName };

    console.log(`deleteQuestion: id=${id}, orgName=${orgName}, filter=${JSON.stringify(orgFilter)}`);

    const deletedQuestion = await Question.findOneAndUpdate(
      { _id: id, ...orgFilter },
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
    const user = req.user || req.guest;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const role = user.role?.toLowerCase();
    const userOrg = user.orgName;
    let orgName = (role === "superadmin" && req.query.orgName !== undefined) ? req.query.orgName : userOrg;
    if (orgName === "") orgName = null;
    const { stakeholder } = req.query;

    if (!stakeholder) {
      return res.status(400).json({
        message: "Stakeholder is required"
      });
    }

    // 1. Try to find questions for the specific organization first
    let questions = [];
    if (orgName && orgName !== "") {
      questions = await Question.find({
        stakeholder,
        orgName,
        isDeleted: false
      }).sort({ order: 1 });
      console.log(`getQuestionsByStakeholder: Found ${questions.length} questions for organization "${orgName}"`);
    }

    // 2. Fallback: If no organization questions found (or no orgName), fetch from Master Template
    if (questions.length === 0) {
      console.log(`getQuestionsByStakeholder: No organization questions found. Falling back to Master Template.`);
      const masterFilter = { $or: [{ orgName: null }, { orgName: "" }, { orgName: { $exists: false } }] };
      questions = await Question.find({
        stakeholder,
        ...masterFilter,
        isDeleted: false
      }).sort({ order: 1 });
    }

    return res.status(200).json({
      data: questions
    });
  } catch (error) {
    console.error("Error in getQuestionsByStakeholder:", error);
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
    if (!req.user) {
      console.error("getAllQuestions: req.user is missing! Ensure protect middleware is working.");
      return res.status(401).json({ success: false, message: "Unauthorized: Missing user context" });
    }

    const role = req.user.role?.toLowerCase();
    const userOrg = req.user.orgName;
    let orgName = (role === "superadmin" && req.query.orgName !== undefined) ? req.query.orgName : userOrg;

    // Normalize empty strings and undefined to null for filter logic
    if (orgName === "" || orgName === undefined) orgName = null;

    const { stakeholder, domain, subdomain } = req.query;

    const orgFilter = (orgName === null)
      ? { $or: [{ orgName: null }, { orgName: { $exists: false } }, { orgName: "" }] }
      : { orgName };

    console.log(`getAllQuestions: role=${role}, userOrg=${userOrg}, targetOrg=${orgName}, filter=${JSON.stringify(orgFilter)}`);

    // Build filter object
    const filter = { isDeleted: false, ...orgFilter };

    if (stakeholder) {
      filter.stakeholder = stakeholder;
    }

    if (domain) {
      filter.domain = domain;
    }

    if (subdomain) {
      filter.subdomain = subdomain;
    }

    const questions = await Question.find(filter).sort({ stakeholder: 1, order: 1 });

    console.log(`getAllQuestions: Found ${questions.length} questions for filter:`, JSON.stringify(filter));

    return res.status(200).json({
      success: true,
      data: questions,
      count: questions.length
    });
  } catch (error) {
    console.error("Error in getAllQuestions:", error);
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
    const role = req.user.role?.toLowerCase();
    const userOrg = req.user.orgName;
    let orgName = (role === "superadmin" && req.query.orgName !== undefined) ? req.query.orgName : userOrg;
    if (orgName === "" || orgName === undefined) orgName = null;
    const { id } = req.params;

    const orgFilter = (orgName === null || orgName === "")
      ? { $or: [{ orgName: null }, { orgName: { $exists: false } }, { orgName: "" }] }
      : { orgName };

    console.log(`getQuestionById: id=${id}, orgName=${orgName}, filter=${JSON.stringify(orgFilter)}`);

    const question = await Question.findOne({ _id: id, ...orgFilter });

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
    const role = req.user.role?.toLowerCase();
    const userOrg = req.user.orgName;
    let orgName = (role === "superadmin" && req.body.orgName !== undefined) ? req.body.orgName : userOrg;
    if (orgName === "") orgName = null;
    const updates = req.body.updates || req.body;
    console.log(`Reorder request: received ${Array.isArray(updates) ? updates.length : "invalid"} items`);

    if (!Array.isArray(updates)) {
      return res.status(400).json({ message: "Updates must be an array of objects with id and order properties" });
    }

    const orgFilter = (orgName === null || orgName === "")
      ? { $or: [{ orgName: null }, { orgName: { $exists: false } }, { orgName: "" }] }
      : { orgName };

    console.log(`reorderQuestions: orgName=${orgName}, filter=${JSON.stringify(orgFilter)}, updatesCount=${updates.length}`);
    const bulkOps = updates
      .filter(u => (u._id || u.id) && (u.order !== undefined || u.subdomain))
      .map(u => {
        const updateDoc = {};
        if (u.order !== undefined) updateDoc.order = Number(u.order);
        if (u.subdomain) updateDoc.subdomain = u.subdomain;

        return {
          updateOne: {
            filter: { _id: u._id || u.id, ...orgFilter },
            update: { $set: updateDoc }
          }
        };
      });

    if (bulkOps.length === 0) {
      console.log("No valid bulk operations generated from updates:", JSON.stringify(updates).substring(0, 100));
      return res.status(400).json({ message: "No valid order updates provided" });
    }

    const result = await Question.bulkWrite(bulkOps);
    console.log(`Bulk reorder completed: ${result.modifiedCount} documents updated.`);

    return res.status(200).json({
      success: true,
      message: "Questions reordered successfully",
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error("Error in reorderQuestions:", error);
    return res.status(500).json({
      success: false,
      message: "Error reordering questions",
      error: error.message
    });
  }
};
