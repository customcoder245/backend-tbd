import User from "../models/user.model.js";
import Invitation from "../models/invitation.model.js"
import { sendVerificationEmail, sendResetEmail, sendInvitationEmail } from "../utils/sendEmail.js";
import jwt from "jsonwebtoken";



// ==================== sendInvitation ====================
export const sendInvitation = async (req, res) => {
  const { email, role } = req.body;
  const { userId, role: senderRole, firstName, lastName } = req.user || {};

  if (!userId) {
    return res.status(400).json({ message: "User not authenticated" });
  }

  if (senderRole == "superAdmin") {
    if (role !== "admin") {
      return res.status(400).json({ message: "SuperAdmin can only invite Admins." });
    }
  } else if (senderRole == "admin") {
    if (!["leader", "manager", "employee"].includes(role)) {
      return res.status(400).json({ message: "Admins can only invite Leaders, Managers, or Employees." });
    }
  } else {
    return res.status(400).json({ message: "only superAdmin or admin can send the invitation" });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: "User already exists" });
  }

  const token = jwt.sign({ email, role, invitedId: userId, inviterName: `${firstName} ${lastName}` }, process.env.JWT_SECRET, { expiresIn: '1h' });

  // Set invitation expiration time (1 hour)
  const expiredAt = Date.now() + 60 * 60 * 1000;

  const invitation = new Invitation({
    email,
    role,
    token,
    token1: token,
    adminId: userId,
    invitedBy: userId,
    expiredAt,
  });

  await invitation.save();

  const link = `${process.env.BACKEND_URL}auth/invite/${token}`;

  // Send invitation email
  await sendInvitationEmail(email, link);

  res.status(200).json({ message: "Invitation sent successfully" });
};

// ==================== AcceptInvitation ====================
export const acceptInvitation = async (req, res) => {
  const { token } = req.params;
  // console.log("token at accept invitation", token)

  // Step 1: Find the invitation using the token
  const invitation = await Invitation.findOne({ token });

  console.log("invitation1 :", invitation)
  // Step 2: Check if the invitation exists (don't check expiration here)
  if (!invitation) {
    return res.status(400).json({ message: "Invitation is invalid." });
  }

  if (invitation.expiredAt < Date.now()) {
    return res.status(400).json({ message: "Invitation has expired." });
  }

  let decode;
  try {
    // Decode the token to extract user information
    decode = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return res.status(400).json({ message: 'Invalid token.' });
  }

  // Step 3: Check if the email in the token matches the invitation email
  if (decode.email !== invitation.email) {
    return res.status(400).json({ message: "Invalid invitation." });
  }

  // Step 4: Generate a JWT token for the accepted invitation (authentication token)
  const authToken = jwt.sign({ email: decode.email, role: invitation.role, userId: invitation.adminId }, process.env.JWT_SECRET, { expiresIn: '1h' });

  // console.log("Auth TOken: ", authToken)
  // Set the cookie for the user (with the auth token)
  res.cookie("authToken", authToken, {
    httpOnly: true,
    secure: true, // Set to true if you're using HTTPS
    sameSite: "none", // Necessary for cross-site cookies
    maxAge: 60 * 60 * 1000, // Cookie expiration (1 hour)
    path: "/"
  });

  res.cookie("token1", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 60 * 60 * 1000,  // 1 hour expiry (same as invitation)
    path: "/"
  });

  // res.cookie("authToken", authToken, cookieOptions);
  // res.cookie("token1", token, cookieOptions);

  // Redirect to registration page
  return res.redirect(`${process.env.FRONTEND_URL}/register`);
};


// ==================== Register ====================
// export const register = async (req, res) => {
//   // console.log(req.body)
//   const { email, password, confirmPassword, token, token1 } = req.body;

//   // console.log("token", token)
//   // console.log("token1 ", token1)
//   // Step 1: Validate input
//   if (!email || !password || !confirmPassword || !token || !token1) {
//     return res.status(400).json({ message: "All fields are required." });
//   }

//   if (password !== confirmPassword) {
//     return res.status(400).json({ message: "Passwords do not match." });
//   }

//   // Step 2: Verify the invitation token
//   let decoded;
//   try {
//     decoded = jwt.verify(token, process.env.JWT_SECRET);
//   } catch (err) {
//     return res.status(400).json({ message: 'Invitation expired. Please request a new invitation' });
//   }
//   // console.log("all data by register ", req.body)

//   // Step 3: Find the invitation using the token
//   const invitation = await Invitation.findOne({ token: token1 });


//   // console.log("invitation 2:",invitation)
//   // Step 4: Check if the invitation exists and is valid ONLY after registration
//   if (!invitation || invitation.expiresAt < Date.now()) {
//     return res.status(400).json({ message: "Invitation has expired." });
//   }

//   // Step 5: Check if the email in the token matches the invitation email
//   if (decoded.email !== invitation.email) {
//     return res.status(400).json({ message: "Invalid invitation email." });
//   }

//   // Step 6: Check if the user already exists
//   const existingUser = await User.findOne({ email: decoded.email });
//   if (existingUser) {
//     return res.status(400).json({ message: "Email is already registered." });
//   }

//   // Step 7: Create the user (storing plain password for now)
//   const user = await User({
//     email: decoded.email,
//     password, // ⚠️ Password hashing can be added later
//     profileCompleted: false,  // Since they are completing their profile during registration
//     isEmailVerified: false,  // Since this is registration from an invitation link
//   });

//   await user.save();

//   // Step 8: Generate a registration verification token
//   const verificationToken = jwt.sign(
//     { email: user.email, id: user._id },
//     process.env.JWT_SECRET,
//     { expiresIn: "1h" }
//   );

//   // Step 9: Send email verification
//   const verificationLink = `${process.env.BACKEND_URL}auth/verify-email/${verificationToken}`;
//   await sendVerificationEmail(user.email, verificationLink);

//   // Step 10: Update invitation record to mark as used
//   invitation.used = true;
//   await invitation.save();

//   // Step 11: Respond to the user
//   res.status(201).json({
//     message: "Registration successful. Please verify your email.",
//     user: {
//       id: user._id,
//       email: user.email,
//     },
//   });
// };



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
  const { token, firstName, lastName, department, role } = req.body;

  // Step 1: Find the user by the email verification token
  const user = await User.findOne({ emailVerificationToken: token });

  if (!user) {
    return res.status(400).json({ message: "Invalid token." });
  }

  if (user.emailVerificationExpires < Date.now()) {
    return res.status(400).json({ message: "Token has expired." });
  }

  // Step 2: Update the user's profile
  user.firstName = firstName;
  user.lastName = lastName;
  user.department = department;
  user.role = role;
  user.profileCompleted = true;
  user.emailVerificationToken = null; // Expire the token since profile is complete

  await user.save();

  // Step 3: Mark the invitation as used after profile completion
  const invitation = await Invitation.findOne({ email: user.email });
  if (invitation) {
    invitation.used = true; // Mark invitation as used after profile completion
    invitation.expiresAt = Date.now(); // Expire the invitation after profile completion
    await invitation.save();
  }

  res.json({ message: "Profile completed successfully." });
};



/* ================= LOGIN ================= */
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

/* ================= FORGOT PASSWORD ================= */
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

/* ================= RESET PASSWORD REDIRECT ================= */
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

/* ================= RESET PASSWORD ================= */
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








export const register = async (req, res) => {
  const { email, password, confirmPassword } = req.body;
  const {authToken, token1} = req.cookies

  // Step 1: Validate input
  if (!email || !password || !confirmPassword || !authToken || !token1) {
    return res.status(400).json({ message: "All fields are required." });
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
    emailVerificationToken: jwt.sign({ email: decoded.email }, process.env.JWT_SECRET, { expiresIn: "1h" }), // Generate the email verification token
    emailVerificationExpires: Date.now() + 60 * 60 * 1000, // 1 hour expiration for the verification token
    isEmailVerified: false,  // User must verify their email
    profileCompleted: false,  // Profile not yet completed
  });

  await user.save();

  // Step 7: Generate the email verification link
  const verificationLink = `${process.env.BACKEND_URL}auth/verify-email/${user.emailVerificationToken}`;

  // Send email verification
  await sendVerificationEmail(user , verificationLink);

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
