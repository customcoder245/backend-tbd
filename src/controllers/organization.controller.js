import Organization from "../models/organization.model.js";

export const getOrganizationDepartments = async (req, res) => {
  try {
    const { orgName: queryOrgName } = req.query;
    const isSuperAdmin = req.user.role?.toLowerCase() === "superadmin";
    const searchName = isSuperAdmin ? (queryOrgName || req.user.orgName) : req.user.orgName;

    if (!searchName) {
      return res.status(400).json({ message: "Organization name is required." });
    }

    const organization = await Organization.findOne({ name: searchName });
    if (!organization) {
      return res.status(200).json({ departments: [] });
    }

    res.status(200).json({ departments: organization.departments });
  } catch (error) {
    console.error("Error fetching departments:", error);
    res.status(500).json({ message: "Internal server error: " + error.message });
  }
};

export const addDepartment = async (req, res) => {
  try {
    const { department } = req.body;
    const orgName = req.user.orgName;

    if (!department) {
      return res.status(400).json({ message: "Department name is required." });
    }

    if (!orgName) {
      return res.status(400).json({ message: "User is not associated with an organization." });
    }

    let organization = await Organization.findOne({ name: orgName });
    if (!organization) {
      organization = new Organization({
        name: orgName,
        createdBy: req.user.userId,
        departments: [department]
      });
    } else {
      if (organization.departments.includes(department)) {
        return res.status(400).json({ message: "Department already exists." });
      }
      organization.departments.push(department);
    }

    await organization.save();
    res.status(200).json({ message: "Department added successfully", departments: organization.departments });
  } catch (error) {
    console.error("Error adding department:", error);
    res.status(500).json({ message: "Internal server error: " + error.message });
  }
};

export const removeDepartment = async (req, res) => {
  console.log(">>> [API] removeDepartment called");
  try {
    const department = req.body?.department || req.query?.department;
    const orgName = req.user?.orgName;

    if (!department) {
      return res.status(400).json({ message: "Department name is required." });
    }

    if (!orgName) {
      return res.status(400).json({ message: "User is not associated with an organization." });
    }

    let organization = await Organization.findOne({ name: orgName });
    if (!organization) {
      return res.status(404).json({ message: "Organization not found." });
    }

    // Manual removal to mirror the behavior of addDepartment (which works)
    if (organization.departments) {
      organization.departments = organization.departments.filter(d => d !== department);
      
      // We use validateBeforeSave: false to bypass any strict validation on old records
      await organization.save({ validateBeforeSave: false });
    }

    res.status(200).json({ message: "Department removed successfully", departments: organization.departments });
  } catch (error) {
    console.error("Error removing department:", error);
    res.status(500).json({ message: "Internal server error: " + error.message });
  }
};
