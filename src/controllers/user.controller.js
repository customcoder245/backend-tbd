import User from "../models/user.model.js";
import Assessment from "../models/assessment.model.js";
import SubmittedAssessment from "../models/submittedAssessment.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { getAssessmentCycleStartDate } from "../config/assessment.config.js";

// ==================== GET Current Authenticated User (auth/me) ====================
export const getMe = async (req, res) => {
    try {
        let user = null;
        if (req.user?.userId) {
            user = await User.findById(req.user.userId).select("-password").populate("adminId", "orgLogo");
        }

        // FALLBACK: If no user found (e.g. Employee via invite token)
        if (!user && req.guest) {
            const { email, invitationId } = req.guest;
            const [assessment, submitted] = await Promise.all([
                Assessment.findOne({
                    isDeleted: { $ne: true },
                    $or: [{ invitationId }, { employeeEmail: email }]
                }).sort({ submittedAt: -1 }).lean(),
                SubmittedAssessment.findOne({
                    $or: [{ "userDetails.email": email }, { assessmentId: invitationId }] // Note: guest might use invitationId as a ref
                }).sort({ submittedAt: -1 }).lean()
            ]);

            const latest = (submitted?.submittedAt > assessment?.submittedAt) ? submitted : (assessment || submitted);
            const isCompleted = latest?.isCompleted || !!submitted;
            const submittedAt = latest?.submittedAt;

            let assessmentStatus = "NOT_STARTED";
            let orgLogo = "";
            let firstName = "";
            let lastName = "";
            let role = req.guest.role || "employee";
            let orgName = assessment?.orgName || req.guest.orgName || "";

            if (latest) {
                if (isCompleted) {
                    assessmentStatus = "COMPLETED";
                    const cycleStart = getAssessmentCycleStartDate();
                    if (submittedAt < cycleStart) {
                        assessmentStatus = "DUE";
                    }
                } else {
                    assessmentStatus = "PENDING";
                }
                firstName = latest.userDetails?.firstName || "";
                lastName = latest.userDetails?.lastName || "";

                const inviter = await User.findById(latest.invitedBy || latest.adminId).select("orgLogo");
                if (inviter) orgLogo = inviter.orgLogo;
            }

            return res.status(200).json({
                _id: "guest-" + (invitationId || email),
                firstName,
                lastName,
                role,
                orgName,
                orgLogo,
                isGuest: true,
                assessmentStatus
            });
        }

        if (!user) return res.status(404).json({ message: "User not found" });

        let assessmentStatus = "NOT_REQUIRED";
        const userRole = user.role?.toLowerCase();
        const rolesWithAssessment = ["employee", "leader", "manager"];

        if (rolesWithAssessment.includes(userRole)) {
            // Check Live (Assessment) and Finalized (SubmittedAssessment)
            const [incomplete, liveComplete, submitted] = await Promise.all([
                Assessment.findOne({ userId: user._id, isCompleted: false, isDeleted: { $ne: true } }).lean(),
                Assessment.findOne({ userId: user._id, isCompleted: true, isDeleted: { $ne: true } }).sort({ submittedAt: -1 }).lean(),
                SubmittedAssessment.findOne({ userId: user._id }).sort({ submittedAt: -1 }).lean()
            ]);

            const latestCompleted = (submitted?.submittedAt > liveComplete?.submittedAt)
                ? submitted : (liveComplete || submitted);

            if (incomplete) {
                assessmentStatus = "PENDING";
            } else if (!latestCompleted) {
                assessmentStatus = "DUE";
            } else {
                const cycleStart = getAssessmentCycleStartDate();
                assessmentStatus = latestCompleted.submittedAt < cycleStart ? "DUE" : "COMPLETED";
            }
        }

        let orgLogo = user.orgLogo || "";
        if (user.role !== "admin" && user.role !== "superAdmin") {
            if (user.adminId && user.adminId.orgLogo) {
                orgLogo = user.adminId.orgLogo;
            } else if (user.orgName) {
                const adminUser = await User.findOne({ orgName: user.orgName, role: "admin" }).select("orgLogo");
                if (adminUser && adminUser.orgLogo) {
                    orgLogo = adminUser.orgLogo;
                }
            }
        }

        res.status(200).json({
            _id: user._id,
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            middleInitial: user.middleInitial || "",
            role: user.role || "",
            orgName: user.orgName || "",
            profileImage: user.profileImage || "",
            orgLogo: orgLogo,
            department: user.department || "",
            debug: "v2",
            assessmentStatus
        });
    } catch (error) {
        console.error("getMe error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// ------------------------ Get profile information ---------------------
export const myProfile = async (req, res) => {
    try {
        let user = null;
        if (req.user?.userId) {
            user = await User.findById(req.user.userId).select("-password").populate("adminId", "orgLogo");
        }

        // FALLBACK: If no user found (e.g. Employee via invite token), try to fetch data from Assessment
        if (!user && req.guest) {
            const { email, invitationId } = req.guest;
            const assessment = await Assessment.findOne({
                $or: [{ invitationId }, { employeeEmail: email }]
            }).sort({ submittedAt: -1 });

            if (assessment) {
                const details = assessment.userDetails || {};
                const inviter = await User.findById(assessment.invitedBy).select("orgName orgLogo");

                return res.status(200).json({
                    firstName: details.firstName || "",
                    middleInitial: details.middleInitial || "",
                    lastName: details.lastName || "",
                    email: email,
                    role: req.guest.role || "employee",
                    orgName: assessment.orgName || inviter?.orgName || "",
                    department: assessment.department || "",
                    phoneNumber: details.phoneNumber || "",
                    dob: details.dob || "",
                    gender: details.gender || "",
                    country: details.country || "",
                    state: details.state || "",
                    zipCode: details.zipCode || "",
                    profileImage: details.profileImage || "",
                    orgLogo: inviter?.orgLogo || "",
                    profileCompleted: true,
                    isGuest: true
                });
            }
        }

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        let orgLogo = user.orgLogo || "";
        if (user.role !== "admin" && user.role !== "superAdmin") {
            if (user.adminId && user.adminId.orgLogo) {
                orgLogo = user.adminId.orgLogo;
            } else if (user.orgName) {
                const adminUser = await User.findOne({ orgName: user.orgName, role: "admin" }).select("orgLogo");
                if (adminUser && adminUser.orgLogo) {
                    orgLogo = adminUser.orgLogo;
                }
            }
        }

        res.status(200).json({
            // Basic Info
            firstName: user.firstName || "",
            middleInitial: user.middleInitial || "",
            lastName: user.lastName || "",
            email: user.email || "",
            role: user.role || "",
            orgName: user.orgName || "",
            department: user.department || "",

            // Personal Info
            dob: user.dob || "",
            gender: user.gender || "",
            phoneNumber: user.phoneNumber || "",

            // Address Info
            country: user.country || "",
            state: user.state || "",
            zipCode: user.zipCode || "",

            profileImage: user.profileImage || "",
            orgLogo: orgLogo,

            // Optional flags (helpful for frontend)
            profileCompleted: user.profileCompleted,
            notificationPreferences: user.notificationPreferences
        });

    } catch (error) {
        console.error("myProfile error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// ------------------------ Update Profile ---------------------
export const updateProfile = async (req, res) => {
    try {
        const {
            firstName,
            middleInitial,
            lastName,
            dob,
            gender,
            phoneNumber,
            country,
            state,
            zipCode,
            department
        } = req.body;

        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (firstName !== undefined) user.firstName = firstName;
        if (middleInitial !== undefined) user.middleInitial = middleInitial;
        if (lastName !== undefined) user.lastName = lastName;

        if (dob !== undefined) user.dob = dob || null;

        if (gender !== undefined) user.gender = gender || "";

        if (phoneNumber !== undefined) user.phoneNumber = phoneNumber || undefined;

        if (country !== undefined) user.country = country;
        if (state !== undefined) user.state = state;
        if (zipCode !== undefined) user.zipCode = zipCode;
        if (department !== undefined) user.department = department;

        if (req.files) {
            if (req.files["profileImage"] && req.files["profileImage"][0]) {
                const cloudinaryResponse = await uploadOnCloudinary(req.files["profileImage"][0].path);
                if (cloudinaryResponse) {
                    user.profileImage = cloudinaryResponse.secure_url;
                }
            }
            if (req.files["orgLogo"] && req.files["orgLogo"][0]) {
                const cloudinaryResponse = await uploadOnCloudinary(req.files["orgLogo"][0].path);
                if (cloudinaryResponse) {
                    user.orgLogo = cloudinaryResponse.secure_url;
                }
            }
        }

        await user.save();

        res.status(200).json({
            message: "Profile updated successfully",
            user: {
                firstName: user.firstName,
                lastName: user.lastName,
                profileImage: user.profileImage,
                orgLogo: user.orgLogo,
                state: user.state,
                zipCode: user.zipCode,
                phoneNumber: user.phoneNumber,
                department: user.department
            }
        });

    } catch (error) {
        console.error("updateProfile error:", error);

        if (error.code === 11000) {
            let field = "Field";
            if (error.keyPattern) {
                field = Object.keys(error.keyPattern)[0];
            } else if (error.message && error.message.includes("index: ")) {
                const match = error.message.match(/index: (?:.*\.)?\$?([a-zA-Z0-9_]+)_/);
                if (match) field = match[1];
            }

            return res.status(400).json({
                message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`
            });
        }

        if (error.name === "ValidationError") {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ message: messages.join(", ") });
        }

        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};
