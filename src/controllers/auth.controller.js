import User from "../models/user.model.js";
import Invitation from "../models/invitation.model.js"
import { sendVerificationEmail, sendResetEmail, sendInvitationEmail } from "../utils/sendEmail.js";
import jwt from "jsonwebtoken";

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
    { email: decode.email, role: invitation.role, userId: invitation.adminId },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  const cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 60 * 60 * 1000,
    path: "/"
  };

  res.cookie("authToken", authToken, cookieOptions);
  res.cookie("token1", token, cookieOptions);

  // FIX: Use invitation.role instead of just 'role'
  if (invitation.role === "employee") {
    return res.redirect(`${process.env.FRONTEND_URL}/start-assessment`);
  }

  return res.redirect(`${process.env.FRONTEND_URL}/register`);
};

// ================= REGISTER ================= 
export const register = async (req, res) => {
  const { email, password, confirmPassword } = req.body;
  const { authToken, token1 } = req.cookies

  console.log("Register called with:", { email, authToken, token1 });
  if (!email || !password || !confirmPassword || !authToken || !token1) {
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
  if (!invitation || invitation.expiresAt < Date.now()) {
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
    orgName: invitation.orgName || "",
    emailVerificationToken: jwt.sign({ email: decoded.email }, process.env.JWT_SECRET, { expiresIn: "1h" }), // Generate the email verification token
    role: invitation.role,
    emailVerificationExpires: Date.now() + 60 * 60 * 1000, // 1 hour expiration for the verification token
    invitationToken: token1,
    isEmailVerified: false,  // User must verify their email
    profileCompleted: false,  // Profile not yet completed
  });
  console.log("Creating user with orgName:", invitation.orgName);

  await user.save();

  // Step 7: Generate the email verification link
  const verificationLink = `${process.env.BACKEND_URL}auth/verify-email/${user.emailVerificationToken}`;

  // Send email verification
  await sendVerificationEmail(user, verificationLink);

  // Step 8: Mark the invitation as used
  invitation.used = true;
  await invitation.save();

  // Step 9: Respond to the user
  res.status(201).json({
    message: "Registration successful. Please verify your email.",
    user: {
      id: user._id,
      email: user.email,
    },
  });
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

  res.cookie("verifyToken", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 15 * 60 * 1000
  });

  res.redirect(`${process.env.FRONTEND_URL}/profile-info`);
};

// ==================== Complete Profile ====================
export const completeProfile = async (req, res) => {
  try {
    const tokenFromCookie = req.cookies.verifyToken;
    const { firstName, lastName, department, titles, orgName } = req.body;
    
    if (!tokenFromCookie) {
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
    }
    
    res.clearCookie("verifyToken", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
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
    const { verifyToken } = req.cookies;
    if (!verifyToken) {
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
      role: user.role
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
  
  res.cookie("resetToken", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
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
    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
    };
    
    // Clear ALL auth-related cookies
    res.clearCookie("authToken", cookieOptions);
    res.clearCookie("token1", cookieOptions);
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
  // Extract data from the logged-in user (req.user is populated by your auth middleware)
  const role = req.user.role;
  const orgName = req.user.orgName;
  const userId = req.user.userId;

  try {
    let query = {};

    // Normalize role check to handle case sensitivity (superAdmin vs superadmin)
    if (role.toLowerCase() === "superadmin") {
      query = {}; 
    } else if (role.toLowerCase() === "admin") {
      // FIX: Admin only sees invitations for THEIR organization that THEY sent
      query = { 
        orgName: orgName, 
        invitedBy: userId 
      };
    } else {
      return res.status(403).json({ message: "Access denied." });
    }

    const invitations = await Invitation.find(query).sort({ createdAt: -1 });

    const formattedData = await Promise.all(
      invitations.map(async (inv) => {
        let status = "Pending";
        let name = "—";
        const isExpired = new Date(inv.expiredAt) < new Date();

        if (inv.used) {
          status = "Accept";
          const registeredUser = await User.findOne({ email: inv.email });
          if (registeredUser) {
            name = `${registeredUser.firstName} ${registeredUser.lastName}`;
          }
        } else if (isExpired) {
          status = "Expire";
        }

        return {
          _id: inv._id,
          name: name,
          email: inv.email,
          role: inv.role,
          orgName: inv.orgName,
          createdAt: inv.createdAt,
          status: status,
        };
      })
    );

    res.status(200).json(formattedData);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ==================== Complete Profile ====================
// export const completeProfile = async (req, res) => {
//   const { token, firstName, lastName, department} = req.body;

//   // Step 1: Find the user by the email verification token
//   const user = await User.findOne({ emailVerificationToken: token });

//   if (!user) {
//     return res.status(400).json({ message: "Invalid token." });
//   }


//   // Step 2: Update the user's profile
//   user.firstName = firstName;
//   user.lastName = lastName;
//   user.department = department;
//   // user.role = role;
//   user.profileCompleted = true;
//   user.emailVerificationToken = null; // Expire the token since profile is complete
//   user.emailVerificationExpires = null;

//   await user.save();

//   // Step 3: Mark the invitation as used after profile completion
//   const invitation = await Invitation.findOne({ email: user.email });
//   if (invitation) {
//     invitation.used = true; // Mark invitation as used after profile completion
//     invitation.expiresAt = Date.now(); // Expire the invitation after profile completion
//     await invitation.save();
//   }
//   res.clearCookie("verifyToken");
//   res.json({ message: "Profile completed successfully." });
// };