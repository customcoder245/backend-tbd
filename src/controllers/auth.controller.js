import User from "../models/user.model.js";
import Invitation from "../models/invitation.model.js"
import { sendVerificationEmail, sendResetEmail, sendInvitationEmail } from "../utils/sendEmail.js";
import jwt from "jsonwebtoken";


/* ================= sendInvitation ================= */

export const sendInvitation = async (req, res) => {
  const { email, role } = req.body;
  const { userId, role: senderRole, firstName, lastName } = req.user

  if (senderRole == "superAdmin") {
    if (role == "admin") {
      return res.status(400).json({ message: "SuperAdmin can only invite Admins." });
    }
  } else if (senderRole == "admin") {
    if (!["leader", "manager", "employee"].includes.role) {
      return res.status(400).json({ message: "Admins can only invite Leaders, Managers, or Employees." })
    }
  } else {
    return res.status(400).json({ message: "only superAdmin or admin can send the invitation" })
  }

  const existingUser = User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: "user already existed" })
  }

  const token = jwt.sign({ email, role, invitedId: userId, inviterName: `${firstName} ${lastName}` }, process.env.JWT_SECRET, { expiresIn: '1h' });

  const expiresAt = Date.now() + 60 * 60 * 1000;
  const invitation = new Invitation({
    email,
    role,
    token,
    adminId: userId,
    invitedBy: userId,  // The admin or superadmin who sent the invitation
    expiresAt
  })

  await invitation.save()

  const link = `${process.env.BACKEND_URL}/auth/invite/${token}`;

  await sendInvitationEmail(email, link);

  res.status(200).json({ message: "Invitation sent successfully" });

}

/* ================= AcceptInvitation ================= */

export const acceptInvitation = async(req, res) => {
  const {token} = req.params;

  const invitation  = await Invitation.findOne({token});

  if(!invitation || invitation.expiresAt < Date.now()){
    return res.status(400).json({message: "Invitation has expired or is invalid."})
  }

  let decode;
  try {
    decode = jwt.verify(token, process.env.JWT_SECRET)
  } catch (error) {
    return res.status(400).json({ message: 'Invalid token.' });
  }

  if(decode.email !== invitation.email){
    return res.status(400).json({message: "Invalid invitation."})
  }

  if(invitation.used){
    return res.status(400).json({message: "Invitation has already been used."})
  }

  invitation.used = true
  await invitation.save()

  if (role === "employee") {
    return res.redirect(`${process.env.FRONTEND_URL}/assessment/start`);
  }

  res.redirect(`${process.env.FRONTEND_URL}/register`);
}

/* ================= REGISTER ================= */
export const register = async (req, res) => {
  const { token, password, confirmPassword, firstName, lastName, department, role } = req.body;

  // Step 1: Validate input
  if (!password || !confirmPassword || !firstName || !lastName || !department || !role) {
    return res.status(400).json({ message: "All fields are required." });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match." });
  }

  // Step 2: Verify the token
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(400).json({ message: 'Invalid or expired token.' });
  }

  // Step 3: Find the invitation using the token (so we can validate the email)
  const invitation = await Invitation.findOne({ token });

  if (!invitation || invitation.expiresAt < Date.now()) {
    return res.status(400).json({ message: "Invitation has expired." });
  }

  // Step 4: Check if the email in the token matches the one in the invitation
  if (decoded.email !== invitation.email) {
    return res.status(400).json({ message: "Invalid invitation email." });
  }

  // Step 5: Check if the user already exists
  const existingUser = await User.findOne({ email: decoded.email });
  if (existingUser) {
    return res.status(400).json({ message: "Email is already registered." });
  }

  // Step 6: Hash the password
  // const hashedPassword = await bcrypt.hash(password, 10);

  // Step 7: Create the user
  const user = new User({
    email: decoded.email,
    password: hashedPassword,
    firstName,
    lastName,
    department,
    role: decoded.role,  // Assign the role from the token
    profileCompleted: true,  // Since they are completing their profile during registration
    isEmailVerified: true,  // Since this is registration from an invitation link
  });

  await user.save();

  // Step 8: Update invitation record to mark as used
  invitation.used = true;
  await invitation.save();

  // Step 9: Optionally clear the email verification token (since it's used)
  const link = `${process.env.BACKEND_URL}/auth/verify-email/${user.emailVerificationToken}`;

  res.status(201).json({
    message: "Registration successful. Please verify your email.",
    user: {
      id: user._id,
      email: user.email,
    },
  });
};


/* ================= VERIFY EMAIL (COOKIE + REDIRECT) ================= */
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



/* ================= COMPLETE PROFILE ================= */
export const completeProfile = async (req, res) => {
  const { token, firstName, lastName, department, password } = req.body;

  // Step 1: Find the user by the token
  const user = await User.findOne({ emailVerificationToken: token });

  if (!user) {
    return res.status(400).json({ message: "Invalid token." });
  }

  if (user.emailVerificationExpires < Date.now()) {
    return res.status(400).json({ message: "Token has expired." });
  }

  // Step 2: Hash the password before saving (if it's provided)
  if (password) {
    user.password = password; // Hash this password before saving (e.g., using bcrypt)
  }

  // Step 3: Update the user's profile information
  user.firstName = firstName;
  user.lastName = lastName;
  user.department = department;
  user.profileCompleted = true;
  user.emailVerificationToken = null; // Token should expire after profile completion

  // Step 4: Save the user's information
  await user.save();

  // Step 5: Clear the token cookie and send a success response
  res.clearCookie("verifyToken");
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
