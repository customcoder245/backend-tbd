import Question from "../models/question.model.js";
import xlsx from "xlsx";
import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    const { orgName: targetOrg, department, questions: questionsInput } = req.body;
    let orgName = (role === "superadmin" && targetOrg !== undefined) ? targetOrg : userOrg;
    if (orgName === "") orgName = null; // Normalize empty string to null for Master Template
    const targetDept = (department === "" || department === undefined || department === "All") ? null : department;
    const questions = questionsInput || req.body;

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
          department: targetDept,
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
    const { orgName: targetOrg, department } = req.body;
    let orgName = (role === "superadmin" && targetOrg !== undefined) ? targetOrg : userOrg;

    if (!orgName) {
      return res.status(400).json({ success: false, message: "Organization name is required." });
    }

    const targetDept = (department === "" || department === undefined || department === "All") ? null : department;

    // 1. Check if already initialized for this org/dept context
    const existingCount = await Question.countDocuments({ orgName, department: targetDept });
    if (existingCount > 0) {
      return res.status(400).json({ success: false, message: `Organization "${orgName}"${targetDept ? ` and department "${targetDept}"` : ""} already has questions. Clone aborted.` });
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
      qObj.orgName = orgName;
      qObj.department = targetDept;
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

    // Validate ObjectId format
    if (!id || id.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid question ID format"
      });
    }

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

    const role = (req.user.role || "").toLowerCase();
    const isSuperAdmin = role === "superadmin" || role === "super_admin";

    const oldQuestion = await Question.findById(id);
    if (!oldQuestion) {
      return res.status(404).json({ message: "Question not found" });
    }

    // Authorization Check
    if (!isSuperAdmin && oldQuestion.orgName && oldQuestion.orgName !== req.user.orgName) {
      return res.status(403).json({ message: "Unauthorized: You don't have access to this organization's questions" });
    }

    // Re-generate questionCode if questionType changes (use question's own orgName context)
    let generatedCode = oldQuestion.questionCode;
    if (questionType && questionType !== oldQuestion.questionType) {
      generatedCode = await generateQuestionCode(
        oldQuestion.stakeholder,
        oldQuestion.domain,
        oldQuestion.subdomain,
        questionType,
        oldQuestion.orgName
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
        forcedChoice: scale === "FORCED_CHOICE" ? forcedChoice : null,
        order: order !== undefined ? Number(order) : oldQuestion.order
      },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      message: "Question updated successfully",
      data: updatedQuestion
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Question code already exists for this stakeholder and organization"
      });
    }
    console.error("Error in updateQuestion:", error);
    return res.status(500).json({
      success: false,
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

    // Validate ObjectId format
    if (!id || id.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid question ID format"
      });
    }

    const role = (req.user.role || "").toLowerCase();
    const isSuperAdmin = role === "superadmin" || role === "super_admin";

    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    // Auth Check
    if (!isSuperAdmin && question.orgName && question.orgName !== req.user.orgName) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    question.isDeleted = true;
    await question.save();

    return res.status(200).json({
      message: "Question deleted successfully"
    });
  } catch (error) {
    console.error("Error in deleteQuestion:", error);
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

    const { stakeholder, domain, subdomain, department } = req.query;

    // Normalize department: empty string or "All" leads to null (which usually means org-wide)
    let targetDept = (department === "" || department === undefined || department === "All") ? null : department;

    const orgFilter = (orgName === null)
      ? { $or: [{ orgName: null }, { orgName: { $exists: false } }, { orgName: "" }] }
      : { orgName };

    // Build filter object
    const filter = { isDeleted: false, ...orgFilter };

    if (targetDept !== null) {
      filter.department = targetDept;
    } else if (orgName !== null) {
      // If we are looking for "All" departments in an organization, 
      // we might want to see both org-wide (null) and specific dept questions.
      // However, usually "All Department" selection in UI might mean "Show all without dept filter"
      // or "Show only org-wide". 
      // The user image shows "All Department" as a specific choice.
      // If "All Department" is selected, we should probably NOT filter by department field at all.
      // BUT, if the user picks a specific department, we filter.
    }

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
    const { id } = req.params;

    // Validate ObjectId format
    if (!id || id.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid question ID format"
      });
    }

    const question = await Question.findById(id);

    if (!question || question.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Question not found"
      });
    }

    const role = (req.user.role || "").toLowerCase();
    const isSuperAdmin = role === "superadmin" || role === "super_admin";

    // Auth Check
    if (!isSuperAdmin && question.orgName && question.orgName !== req.user.orgName) {
      return res.status(403).json({ success: false, message: "Unauthorized access" });
    }

    return res.status(200).json({
      success: true,
      data: question
    });
  } catch (error) {
    console.error("Error in getQuestionById:", error);
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

/**
 * UPLOAD QUESTIONS FROM EXCEL (Admin)
 */
export const uploadQuestions = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const role = req.user.role?.toLowerCase();
    const userOrg = req.user.orgName;
    const { orgName: targetOrg, department } = req.body;
    let orgName = (role === "superadmin" && targetOrg !== undefined) ? targetOrg : userOrg;
    if (orgName === "") orgName = null;
    const targetDept = (department === "" || department === undefined || department === "All") ? null : department;

    // Read excel file
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    if (data.length === 0) {
      return res.status(400).json({ success: false, message: "Excel file is empty" });
    }

    // Process questions
    const createdQuestions = [];
    const prefixBaseMax = {};
    const batchPrefixCounts = {};
    const maxOrderPerSubdomain = {};

    for (const row of data) {
      const stakeholder = row.stakeholder?.toLowerCase();
      const domain = row.domain;
      const subdomain = row.subdomain;
      const questionType = row.questionType;
      const questionStem = row.questionStem;
      const scale = row.scale;
      const insightPrompt = row.insightPrompt;

      const forcedChoice = (scale === "FORCED_CHOICE" && row["forcedChoice.optionA.label"]) ? {
        optionA: {
          label: row["forcedChoice.optionA.label"],
          insightPrompt: row["forcedChoice.optionA.insightPrompt"] || ""
        },
        optionB: {
          label: row["forcedChoice.optionB.label"],
          insightPrompt: row["forcedChoice.optionB.insightPrompt"] || ""
        },
        higherValueOption: row["forcedChoice.higherValueOption"] || "A"
      } : null;

      if (!stakeholder || !domain || !subdomain || !questionType || !questionStem || !scale) {
        continue; // Skip rows with missing mandatory fields
      }

      // Generate Code
      const dAbbr = domainAbbr[domain] || getAbbreviation(domain);
      const sAbbr = getAbbreviation(subdomain);
      const rolePref = stakeholderPrefix[stakeholder] || stakeholder[0].toUpperCase();
      const tSuff = typeSuffix[questionType] || "";
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

      const countInBatch = batchPrefixCounts[prefix] || 0;
      batchPrefixCounts[prefix] = countInBatch + 1;
      const generatedCode = `${prefix}${prefixBaseMax[prefix] + countInBatch + 1}`;

      // Order management
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

      createdQuestions.push({
        stakeholder,
        domain,
        subdomain,
        questionType,
        questionCode: generatedCode,
        orgName,
        department: targetDept,
        questionStem,
        scale,
        insightPrompt: scale === "FORCED_CHOICE" ? null : insightPrompt,
        forcedChoice: scale === "FORCED_CHOICE" ? forcedChoice : null,
        subdomainWeight: (domain === "People Potential" ? 0.35 : (domain === "Operational Steadiness" ? 0.25 : 0.20)),
        order: maxOrderPerSubdomain[orderKey]
      });
    }

    if (createdQuestions.length === 0) {
      return res.status(400).json({ success: false, message: "No valid questions found in Excel file" });
    }

    const savedQuestions = await Question.insertMany(createdQuestions);

    // Clean up file
    fs.unlinkSync(req.file.path);

    return res.status(201).json({
      success: true,
      message: `${savedQuestions.length} questions uploaded successfully`,
      data: savedQuestions
    });

  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    console.error("Upload Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error uploading questions",
      error: error.message
    });
  }
};

/**
 * DELETE ALL QUESTIONS FOR AN ORGANIZATION (SuperAdmin/Admin)
 */
export const deleteOrganizationQuestions = async (req, res) => {
  try {
    const role = req.user.role?.toLowerCase();
    const userOrg = req.user.orgName;
    const { orgName: targetOrg, department } = req.body;

    let orgName = (role === "superadmin" && targetOrg !== undefined) ? targetOrg : userOrg;
    if (orgName === "") orgName = null;

    const filter = { isDeleted: false };
    if (orgName === null) {
      filter.$or = [{ orgName: null }, { orgName: { $exists: false } }, { orgName: "" }];
    } else {
      filter.orgName = orgName;
    }

    if (department && department !== "All") {
      filter.department = department;
    }

    // Perform hard delete
    const result = await Question.deleteMany(filter);

    return res.status(200).json({
      success: true,
      message: `Successfully deleted all questions for organization "${orgName || "Master Template"}"${department && department !== "All" ? ` and department "${department}"` : ""}.`,
      count: result.deletedCount
    });
  } catch (error) {
    console.error("Delete All Error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while deleting questions.",
      error: error.message
    });
  }
};

/**
 * DOWNLOAD EXCEL TEMPLATE (Admin)
 */
export const downloadTemplate = async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Question Template");

    // Define Columns with Widths
    worksheet.columns = [
      { header: "stakeholder", key: "stakeholder", width: 15 },
      { header: "domain", key: "domain", width: 25 },
      { header: "subdomain", key: "subdomain", width: 30 },
      { header: "questionType", key: "questionType", width: 20 },
      { header: "questionStem", key: "questionStem", width: 50 },
      { header: "scale", key: "scale", width: 20 },
      { header: "insightPrompt", key: "insightPrompt", width: 40 },
      { header: "forcedChoice.optionA.label", key: "optionALabel", width: 35 },
      { header: "forcedChoice.optionA.insightPrompt", key: "optionAInsight", width: 35 },
      { header: "forcedChoice.optionB.label", key: "optionBLabel", width: 35 },
      { header: "forcedChoice.optionB.insightPrompt", key: "optionBInsight", width: 35 },
      { header: "forcedChoice.higherValueOption", key: "higherValue", width: 25 },
    ];

    // Style the Header Row
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1A3652' } // Brand Navy Blue
      };
      cell.font = {
        color: { argb: 'FFFFFFFF' }, // White
        bold: true,
        size: 11
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
    headerRow.height = 25;

    // Add Sample Data
    worksheet.addRows([
      {
        stakeholder: "employee",
        domain: "People Potential",
        subdomain: "Mindset & Adaptability",
        questionType: "Self-Rating",
        questionStem: "I’m open to changing how I work when priorities or information change.",
        scale: "SCALE_1_5",
        insightPrompt: "What makes it difficult to adjust how you work when priorities or information change?",
      },
      {
        stakeholder: "leader",
        domain: "People Potential",
        subdomain: "Psychological Health & Safety",
        questionType: "Forced-Choice",
        questionStem: "Which statement best reflects your team?",
        scale: "FORCED_CHOICE",
        insightPrompt: "",
        optionALabel: "We discuss priorities and adjust expectations.",
        optionAInsight: "",
        optionBLabel: "I’m expected to cope without changes or support.",
        optionBInsight: "What are the impacts and what could be different if you had more support?",
        higherValue: "B"
      }
    ]);

    // Style Data Rows for clarity
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.alignment = { vertical: 'middle', wrapText: true };
      }
    });

    const tempFilePath = path.join(__dirname, "../../tmp-template.xlsx");
    await workbook.xlsx.writeFile(tempFilePath);

    res.download(tempFilePath, "Question_Upload_Template.xlsx", (err) => {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    });

  } catch (error) {
    console.error("Download Template Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error generating colorful template",
      error: error.message
    });
  }
};
