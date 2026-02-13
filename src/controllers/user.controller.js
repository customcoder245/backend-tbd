import User from "../models/user.model.js";
import Assessment from "../models/assessment.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// ==================== GET Current Authenticated User (auth/me) ====================
export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select("-password");
        if (!user) return res.status(404).json({ message: "User not found" });

        let assessmentStatus = "NOT_REQUIRED";
        const userRole = user.role;
        if (["admin", "leader", "manager"].includes(userRole)) {
            const incomplete = await Assessment.findOne({ userId: user._id, isCompleted: false });
            if (incomplete) {
                assessmentStatus = "PENDING";
            } else {
                const complete = await Assessment.findOne({ userId: user._id, isCompleted: true }).sort({ submittedAt: -1 });
                if (!complete) {
                    assessmentStatus = "DUE";
                } else {
                    const threeMonthsAgo = new Date();
                    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
                    if (complete.submittedAt < threeMonthsAgo) {
                        assessmentStatus = "DUE";
                    } else {
                        assessmentStatus = "COMPLETED";
                    }
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
        const user = await User.findById(req.user.userId).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            // Basic Info
            firstName: user.firstName || "",
            middleInitial: user.middleInitial || "",
            lastName: user.lastName || "",
            email: user.email || "",
            role: user.role || "",
            orgName: user.orgName || "",

            // Personal Info
            dob: user.dob || "",
            gender: user.gender || "",
            phoneNumber: user.phoneNumber || "",

            // Address Info
            country: user.country || "",
            state: user.state || "",
            zipCode: user.zipCode || "",

            profileImage: user.profileImage || "",

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
            zipCode
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

        if (req.file) {
            const cloudinaryResponse = await uploadOnCloudinary(req.file.path);
            if (cloudinaryResponse) {
                user.profileImage = cloudinaryResponse.secure_url;
            }
        }

        await user.save();

        res.status(200).json({
            message: "Profile updated successfully",
            user: {
                firstName: user.firstName,
                lastName: user.lastName,
                profileImage: user.profileImage,
                state: user.state,
                zipCode: user.zipCode,
                phoneNumber: user.phoneNumber
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
