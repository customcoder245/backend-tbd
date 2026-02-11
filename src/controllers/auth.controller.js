import User from "../models/user.model.js";
import Invitation from "../models/invitation.model.js";
import Assessment from "../models/assessment.model.js";
import { sendVerificationEmail, sendResetEmail, sendInvitationEmail } from "../utils/sendEmail.js";
import jwt from "jsonwebtoken";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { createNotification, notifySuperAdmins } from "../utils/notification.utils.js";

// ================= Send Invitation ================= 
export const sendInvitation = async (req, res) => {
  const { email, role } = req.body;
  const { userId } = req.user || {}; // We only rely on userId from the token

  if (!userId) {
    return res.status(400).json({ message: "User not authenticated" });
  }

  // Fetch the full inviter details to get names and orgName
  const inviter = await User.findById(userId);
  if (!inviter) {
    return res.status(404).json({ message: "Inviter not found" });
  }

  const senderRole = inviter.role;
  const firstName = inviter.firstName || "Admin";
  const lastName = inviter.lastName || "";
  const organizationName = inviter.orgName;

  // 1. Role Authorization Logic
  if (senderRole === "superAdmin") {
    if (role !== "admin") {
      return res.status(400).json({ message: "SuperAdmin can only invite Admins." });
    }
  } else if (senderRole === "admin") {
    if (!["leader", "manager", "employee"].includes(role)) {
      return res.status(400).json({ message: "Admins can only invite Leaders, Managers, or Employees." });
    }
  }

  // 2. Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: "User already exists" });
  }

  // 3. Generate Token
  const token = jwt.sign(
    {
      email,
      role,
      invitedId: userId,
      inviterName: `${firstName} ${lastName}`,
      orgName: organizationName
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  // 4. Create Invitation record
  const invitation = new Invitation({
    email,
    role,
    token,
    token1: token,
    adminId: userId,
    invitedBy: userId, // Used for the Admin query filter
    orgName: organizationName, // Stored so the Admin can find it in getInvitations
    expiredAt: Date.now() + 60 * 60 * 1000,
  });

  await invitation.save();

  const link = `${process.env.BACKEND_URL}auth/invite/${token}`;
  await sendInvitationEmail(email, link, role, organizationName);

  // 5. Create notifications
  await createNotification({
    recipient: userId,
    title: "Invitation Sent",
    message: `You have successfully invited ${email} as ${role}.`,
    type: "success"
  });

  await notifySuperAdmins({
    title: "New Invitation Created",
    message: `${firstName} ${lastName} (${inviter.role}) invited ${email} to join as ${role}.`,
    excludeUser: userId
  });

  res.status(200).json({ message: "Invitation sent successfully" });
};

// ==================== AcceptInvitation ====================
export const acceptInvitation = async (req, res) => {
  const { token } = req.params;

  const invitation = await Invitation.findOne({ token });

  if (!invitation) {
    return res.status(400).json({ message: "Invitation is invalid." });
  }

  if (invitation.used) {
    return res.redirect(`${process.env.FRONTEND_URL}/invitation-used`);
  }

  if (invitation.expiredAt < Date.now()) {
    return res.status(400).json({ message: "Invitation has expired." });
  }

  let decode;
  try {
    decode = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return res.status(400).json({ message: 'Invalid token.' });
  }

  if (decode.email !== invitation.email) {
    return res.status(400).json({ message: "Invalid invitation." });
  }

  const authToken = jwt.sign(
    {
      email: decode.email,
      role: invitation.role,
      userId: invitation.adminId,
      orgName: invitation.orgName
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  console.log("Setting cookies. isProduction:", isProduction);
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 60 * 60 * 1000,
    path: "/"
  };

  res.cookie("authToken", authToken, cookieOptions);
  res.cookie("token1", token, cookieOptions);

  // Append tokens to URL as fallback for cross-site cookie issues
  let redirectUrl;
  if (invitation.role === "employee") {
    redirectUrl = new URL(`${process.env.FRONTEND_URL}/start-assessment`);
  } else {
    redirectUrl = new URL(`${process.env.FRONTEND_URL}/register`);
  }

  redirectUrl.searchParams.set("authToken", authToken);
  redirectUrl.searchParams.set("token1", token);

  return res.redirect(redirectUrl.toString());
};

// ================= REGISTER ================= 
export const register = async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;
    const authToken = req.cookies.authToken || req.headers["x-auth-token"];
    const token1 = req.cookies.token1 || req.headers["x-invitation-token"];

    console.log("Register Request - Tokens source check:");
    console.log("authToken found in cookies:", !!req.cookies.authToken, "or headers:", !!req.headers["x-auth-token"]);
    console.log("token1 found in cookies:", !!req.cookies.token1, "or headers:", !!req.headers["x-invitation-token"]);
    console.log("Register Request - Body email:", email);

    // Step 1: Validate input
    if (!email || !password || !confirmPassword || !authToken || !token1) {
      let missing = [];
      if (!email) missing.push("email");
      if (!password) missing.push("password");
      if (!confirmPassword) missing.push("confirmPassword");
      if (!authToken) missing.push("authToken token (cookie or header)");
      if (!token1) missing.push("token1 token (cookie or header)");

      console.log("Validation failed. Missing:", missing.join(", "));
      return res.status(400).json({ message: "You are not invited yet, so you cannot register." });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }

    // Step 2: Verify the invitation token
    let decoded;
    try {
      decoded = jwt.verify(authToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ message: 'Invitation expired. Please request a new invitation' });
    }

    // Step 3: Find the invitation using the token
    const invitation = await Invitation.findOne({ token: token1 });
    if (!invitation || invitation.expiredAt < Date.now()) {
      return res.status(400).json({ message: "Invitation has expired." });
    }

    if (invitation.used) {
      return res.status(400).json({ message: "This invitation has already been used." });
    }

    // Step 4: Check if the email in the token matches the invitation email
    if (decoded.email !== invitation.email) {
      return res.status(400).json({ message: "Invalid invitation email." });
    }

    // Step 5: Check if the user already exists
    const existingUser = await User.findOne({ email: decoded.email });
    if (existingUser) {
      return res.status(400).json({ message: "Email is already registered." });
    }

    // Step 6: Create the user
    const user = new User({
      email: decoded.email,
      password, // ⚠️ Remember to hash the password before saving in production
      orgName: decoded.orgName || invitation.orgName || "",
      adminId: invitation.adminId || invitation.invitedBy,
      invitedBy: invitation.invitedBy || invitation.adminId,
      emailVerificationToken: jwt.sign({ email: decoded.email }, process.env.JWT_SECRET, { expiresIn: "1h" }), // Generate the email verification token
      role: invitation.role,
      emailVerificationExpires: Date.now() + 60 * 60 * 1000, // 1 hour expiration for the verification token
      invitationToken: token1,
      isEmailVerified: false,  // User must verify their email
      profileCompleted: false,  // Profile not yet completed
    });

    await user.save();

    // Step 7: Generate the email verification link
    const verificationLink = `${process.env.BACKEND_URL}auth/verify-email/${user.emailVerificationToken}`;

    // Send email verification
    await sendVerificationEmail(user, verificationLink);

    // Step 8: Marks the invitation as used (delayed to complete profile)
    invitation.used = false;
    await invitation.save();

    // Step 9: Respond to the user
    res.status(201).json({
      message: "Registration successful. Please verify your email.",
      user: {
        id: user._id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(400).json({ message: error.message || "Registration failed. Please try again." });
  }
};

// ==================== Verify Email ====================
export const verifyEmail = async (req, res) => {
  const { token } = req.params;

  const user = await User.findOne({
    emailVerificationToken: token,
    emailVerificationExpires: { $gt: Date.now() }  // Check if the verification has expired
  });

  if (!user) {
    return res.redirect(`${process.env.FRONTEND_URL}/register`);
  }

  if (user.emailVerificationExpires < Date.now() && !user.profileCompleted) {
    await User.deleteOne({ _id: user._id });
    return res.status(400).json({ message: "Email verification expired. User has been removed." });
  }

  user.isEmailVerified = true;
  await user.save();

  // 🔑 REQUIRED ON VERCEL
  res.setHeader("Cache-Control", "no-store");

  const isProduction = process.env.NODE_ENV === "production";
  res.cookie("verifyToken", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 15 * 60 * 1000
  });

  res.redirect(`${process.env.FRONTEND_URL}/profile-info?verifyToken=${token}`);
};

// ==================== Complete Profile ====================
export const completeProfile = async (req, res) => {
  try {
    const tokenFromCookie = req.cookies.verifyToken || req.headers["x-verify-token"];
    const { firstName, lastName, department, titles, orgName } = req.body;

    if (!tokenFromCookie) {
      console.log("Complete Profile: No verifyToken found in cookies or headers");
      return res.status(401).json({ message: "Verification session expired." });
    }

    const user = await User.findOne({ emailVerificationToken: tokenFromCookie });

    if (!user) {
      return res.status(400).json({ message: "Invalid token or profile already completed." });
    }

    // Logic for Organization Name
    if (user.role === "admin") {
      if (!orgName) return res.status(400).json({ message: "Organization name is required for Admins." });
      user.orgName = orgName;
    } else {
      // Inherit orgName from the person who invited them
      const inviter = await User.findById(user.invitedBy || user.adminId);
      if (inviter) {
        user.orgName = inviter.orgName;
      }
    }

    user.firstName = firstName;
    user.lastName = lastName;
    user.department = department;
    user.titles = titles;
    user.profileCompleted = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;

    await user.save();

    const invitation = await Invitation.findOne({ email: user.email });
    if (invitation) {
      invitation.used = true;
      await invitation.save();

      // NOTIFICATION for Inviter
      await createNotification({
        recipient: invitation.invitedBy || invitation.adminId, // Notify inviter
        title: "Team Member Joined",
        message: `${user.firstName} ${user.lastName} has accepted your invitation for ${user.orgName} and joined the platform.`,
        type: "success"
      });
    }

    // NOTIFICATION for SuperAdmins
    await notifySuperAdmins({
      title: "New User Registered",
      message: `${user.firstName} ${user.lastName} has joined as ${user.role} for ${user.orgName}.`,
      type: "info"
    });

    const isProduction = process.env.NODE_ENV === "production";
    res.clearCookie("verifyToken", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/"
    });

    res.status(200).json({ message: "Profile completed successfully!" });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Organization name already exists." });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

// ==================== GET Current User Session ====================
export const getCurrentUserSession = async (req, res) => {
  try {
    const verifyToken = req.cookies.verifyToken || req.headers["x-verify-token"];
    if (!verifyToken) {
      console.log("Current User Session: No verifyToken found in cookies or headers");
      return res.status(401).json({ message: "No verification token found." });
    }

    const user = await User.findOne({ emailVerificationToken: verifyToken });
    if (!user) {
      return res.status(404).json({ message: "User not found or session expired." });
    }

    let inheritedOrgName = "";
    // If not an admin, find the admin who invited them to get the org name
    if (user.role !== "admin") {
      const inviter = await User.findById(user.invitedBy || user.adminId);
      inheritedOrgName = inviter ? inviter.orgName : "";
    }

    res.status(200).json({
      role: user.role,
      inheritedOrgName: inheritedOrgName
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// ================= LOGIN =================
export const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user || user.password !== password) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  if (!user.isEmailVerified) {
    return res.status(403).json({ message: "Please verify your email first" });
  }

  if (!user.profileCompleted) {
    return res.status(403).json({ message: "Please complete your profile" });
  }

  const token = user.generateAccessToken();

  res.json({
    accessToken: token,
    user: {
      id: user._id,
      role: user.role,
      orgName: user.orgName
    }
  });
};

// ================= FORGOT PASSWORD ================= 
export const forgotPassword = async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  // 🔒 security: same response always
  if (!user) {
    return res.json({ message: "If exists, email sent" });
  }

  const token = Math.random().toString(36).substring(2, 15);

  user.resetPasswordToken = token;
  user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
  await user.save();

  // ✅ BACKEND link (same pattern as register)
  const link = `${process.env.BACKEND_URL}auth/reset-password/${token}`;
  await sendResetEmail(user.email, link);

  res.json({ message: "If exists, email sent" });
};

// ================= RESET PASSWORD REDIRECT =================
export const resetPasswordRedirect = async (req, res) => {
  const { token } = req.params;

  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) {
    return res.redirect(`${process.env.FRONTEND_URL}/login`);
  }

  // 🔑 REQUIRED ON VERCEL
  res.setHeader("Cache-Control", "no-store");

  const isProduction = process.env.NODE_ENV === "production";
  res.cookie("resetToken", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 15 * 60 * 1000
  });

  res.redirect(`${process.env.FRONTEND_URL}/new-password`);
};

//================= RESET PASSWORD ================= 
export const resetPassword = async (req, res) => {
  const token = req.cookies.resetToken;
  const { password } = req.body;

  if (!token) {
    return res.status(400).json({ message: "Reset token expired" });
  }

  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).json({ message: "Invalid or expired token" });
  }

  user.password = password;
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  await user.save();

  res.clearCookie("resetToken");
  res.json({ message: "Password reset successful" });
};

//================= LOGOUT ================= 
export const logout = async (req, res) => {
  try {
    const isProduction = process.env.NODE_ENV === "production";
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/",
    };

    // Clear ALL auth-related cookies
    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("user", cookieOptions);
    res.clearCookie("verifyToken", cookieOptions);
    res.clearCookie("resetToken", cookieOptions);

    // Prevent caching of protected pages
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    return res.status(200).json({
      message: "Logged out successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Logout failed",
    });
  }
};

// ==================== Get Invitations ====================

export const getInvitations = async (req, res) => {
  try {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const role = req.user.role.toLowerCase();
    const userOrg = req.user.orgName;
    const userId = req.user.userId;

    if (role === "superadmin") {
      const orgStats = await Invitation.aggregate([
        { $match: { role: "admin" } },
        {
          $group: {
            _id: "$email",
            orgNameFromInvite: { $first: "$orgName" },
            createdAt: { $first: "$createdAt" },
            status: { $first: "$used" },
            expiredAt: { $first: "$expiredAt" }
          }
        },
        { $sort: { createdAt: -1 } }
      ]);

      const formattedData = await Promise.all(
        orgStats.map(async (item) => {
          try {
            const adminUser = await User.findOne({ email: item._id });
            const finalOrgName = adminUser?.orgName || item.orgNameFromInvite || "Pending Setup";

            let currentStatus = "Pending";
            if (item.status) {
              currentStatus = "Accept";
            } else if (item.expiredAt && new Date(item.expiredAt) < new Date()) {
              currentStatus = "Expire";
            }

            const totalUsers = await Invitation.countDocuments({
              orgName: finalOrgName
            });

            return {
              _id: item._id, // This is the email for SuperAdmin grouping
              orgName: finalOrgName,
              email: item._id,
              createdAt: item.createdAt,
              totalUsers: totalUsers,
              status: currentStatus,
              role: "admin"
            };
          } catch (innerErr) {
            return { _id: item._id, orgName: "Error", email: item._id, status: "Pending", totalUsers: 0 };
          }
        })
      );
      return res.status(200).json(formattedData);

    } else {
      const invitations = await Invitation.find({ orgName: userOrg, invitedBy: userId }).sort({ createdAt: -1 });
      const formattedData = await Promise.all(
        invitations.map(async (inv) => {
          let name = "—";
          let currentStatus = inv.used ? "Accept" : (new Date(inv.expiredAt) < new Date() ? "Expire" : "Pending");

          // Try to find the registered user by token or email for more robustness
          const registeredUser = await User.findOne({
            $or: [
              { invitationToken: inv.token1 },
              { invitationToken: inv.token },
              { email: inv.email }
            ]
          });

          if (registeredUser) {
            if (registeredUser.firstName || registeredUser.lastName) {
              name = `${registeredUser.firstName || ""} ${registeredUser.lastName || ""}`.trim();
            } else {
              name = "Registered (Pending Info)";
            }
          } else {
            // Try to find if they completed an assessment (unregistered employee)
            const assessment = await Assessment.findOne({ invitationId: inv._id });
            if (assessment && assessment.userDetails) {
              const details = assessment.userDetails;
              name = `${details.firstName || ""} ${details.lastName || ""}`.trim() || "Completed (Anonymous)";
            }
          }

          return {
            _id: inv._id, // This is the MongoDB ID
            name: name,
            email: inv.email,
            role: inv.role,
            createdAt: inv.createdAt,
            status: currentStatus
          };
        })
      );
      return res.status(200).json(formattedData);
    }
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ==================== GET Organization Details ====================
export const getOrgDetails = async (req, res) => {
  try {
    const { orgName } = req.params;
    if (!orgName) return res.status(400).json({ message: "Org name is required" });

    // Fetch all invitations for this organization
    const invitations = await Invitation.find({ orgName }).sort({ createdAt: -1 });

    const formattedMembers = await Promise.all(
      invitations.map(async (inv) => {
        let name = "—";
        let currentStatus = inv.used ? "Accept" : (new Date(inv.expiredAt) < new Date() ? "Expire" : "Pending");

        // Try to find the registered user by token or email
        const registeredUser = await User.findOne({
          $or: [
            { invitationToken: inv.token1 },
            { invitationToken: inv.token },
            { email: inv.email }
          ]
        });

        if (registeredUser) {
          if (registeredUser.firstName || registeredUser.lastName) {
            name = `${registeredUser.firstName || ""} ${registeredUser.lastName || ""}`.trim();
          } else {
            name = "Registered (Pending Info)";
          }
        } else {
          // If no user found, check for assessment data (for employees who might have taken it without full account yet)
          try {
            const assessment = await Assessment.findOne({ invitationId: inv._id });
            if (assessment && assessment.userDetails) {
              const details = assessment.userDetails;
              name = `${details.firstName || ""} ${details.lastName || ""}`.trim() || "Completed (Anonymous)";
            }
          } catch (e) {
            // Assessment check failed or model not available
          }
        }

        return {
          _id: inv._id,
          firstName: name.split(" ")[0] || "—",
          lastName: name.split(" ").slice(1).join(" ") || "",
          name: name, // For display
          email: inv.email,
          role: inv.role,
          createdAt: inv.createdAt,
          status: currentStatus
        };
      })
    );

    // Stats
    const adminUser = await User.findOne({ orgName, role: "admin" });
    const totalMembers = formattedMembers.length;

    // Status can be derived from the admin account status or existence
    const status = adminUser ? (adminUser.isEmailVerified && adminUser.profileCompleted ? "Accept" : "Pending") : "Expired";

    res.status(200).json({
      details: {
        orgName,
        createdAt: adminUser?.createdAt || "N/A",
        status: status,
        totalTeamMember: totalMembers
      },
      members: formattedMembers
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteInvitation = async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Find the invitation first to check its status
    // We handle both MongoDB ID and Email (for SuperAdmin grouping)
    const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { email: id };
    const invites = await Invitation.find(query);

    if (invites.length === 0) {
      return res.status(404).json({ message: "No records found to delete" });
    }

    // 2. Check if ANY of the matched records are still Pending or Accepted
    // We only want to delete if the status is "Expire"
    const canDelete = invites.every(inv => {
      const isExpired = inv.expiredAt && new Date(inv.expiredAt) < new Date();
      return isExpired && !inv.used; // Only true if Expired AND NOT used
    });

    if (!canDelete) {
      return res.status(400).json({
        message: "Only expired invitations can be deleted. Accepted or Pending invites must remain."
      });
    }

    // 3. Perform the deletion
    await Invitation.deleteMany(query);

    res.status(200).json({ message: "Expired invitation deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete" });
  }
};

// ==================== GET Current Authenticated User (auth/me) ====================
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    // console.log("DEBUG: getMe finding user:", user._id, "Image:", user.profileImage);

    res.status(200).json({
      _id: user._id,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      middleInitial: user.middleInitial || "",
      role: user.role || "",
      orgName: user.orgName || "",
      profileImage: user.profileImage || "",
      debug: "v2"
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

    // Use !== undefined to allow clearing optional fields, 
    // but convert empty strings to null or undefined for fields with unique indexes or special types
    if (firstName !== undefined) user.firstName = firstName;
    if (middleInitial !== undefined) user.middleInitial = middleInitial;
    if (lastName !== undefined) user.lastName = lastName;

    // Date fields should be null if empty string
    if (dob !== undefined) user.dob = dob || null;

    if (gender !== undefined) user.gender = gender || "";

    // IMPORTANT: phoneNumber has a unique sparse index. 
    // Multiple empty strings "" will COLLIDE. They must be undefined or null.
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber || undefined;

    if (country !== undefined) user.country = country;
    if (state !== undefined) user.state = state;
    if (zipCode !== undefined) user.zipCode = zipCode;

    // Handle Profile Image upload
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

    // Handle duplicate key error (MongoDB 11000)
    if (error.code === 11000) {
      let field = "Field";
      if (error.keyPattern) {
        field = Object.keys(error.keyPattern)[0];
      } else if (error.message && error.message.includes("index: ")) {
        // Fallback for some mongo versions
        const match = error.message.match(/index: (?:.*\.)?\$?([a-zA-Z0-9_]+)_/);
        if (match) field = match[1];
      }

      return res.status(400).json({
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`
      });
    }

    // Handle Mongoose validation errors
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
