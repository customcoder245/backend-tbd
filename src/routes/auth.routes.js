import express from "express";
import {
  register,
  login,
  logout,
  verifyEmail,
  completeProfile,
  forgotPassword,
  resetPassword,
  resetPasswordRedirect,
  getCurrentUserSession,
  changePassword,
  getAllOrganizations,
  getOrganizationMembers,
  getOrganizationFilters
} from "../controllers/auth.controller.js";

import { getMe, myProfile, updateProfile } from "../controllers/user.controller.js";

import {
  sendInvitation,
  acceptInvitation,
  getInvitations,
  deleteInvitation,
  resetAssessment,
  sendBulkInvitations,
  getInvitationDetails
} from "../controllers/invitation.controller.js";

import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  clearNotifications
} from "../controllers/notification.controller.js";
import { resendVerificationEmail } from "../controllers/resendVerification.controller.js";
import { protect, flexibleProtect } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { uploadCSV } from "../middlewares/csvUpload.middleware.js";
import { updateNotificationPreferences } from "../controllers/preferences.controller.js";

const router = express.Router();

// Core Auth Routes
/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Register a user using an invitation token. The email must match the invitation.
 *     tags:
 *       - Authentication
 *     parameters:
 *       - in: query
 *         name: token
 *         schema:
 *           type: string
 *         description: Optional invitation token (can also be supplied via cookie or headers)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: employee@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "SecureP@ss123"
 *     responses:
 *       201:
 *         description: Registration successful, verification email sent.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Registration successful. Please verify your email.
 *       400:
 *         description: Invalid registration data, mismatching email, or expired/already-used invitation.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: You are not invited yet, so you cannot register.
 *       500:
 *         description: Registration failed.
 */
router.post("/register", register);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Authenticate user / Login
 *     description: Logs a user in, sets a session cookie (accessToken), and returns user profile details and token.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: employee@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "SecureP@ss123"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 user:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 60d21b4667d0d8992e610c85
 *                     email:
 *                       type: string
 *                       example: employee@example.com
 *                     role:
 *                       type: string
 *                       example: employee
 *                     orgName:
 *                       type: string
 *                       example: Acme Corp
 *                     department:
 *                       type: string
 *                       example: Engineering
 *                     profileCompleted:
 *                       type: boolean
 *                       example: true
 *                 accessToken:
 *                   type: string
 *                   description: JWT Bearer Token
 *                 assessmentStatus:
 *                   type: string
 *                   enum: [NONE, PENDING, DUE, COMPLETED]
 *                   example: PENDING
 *       401:
 *         description: Invalid credentials or unverified email
 *       500:
 *         description: Login failed
 */
router.post("/login", login);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Log out user / Clear session
 *     description: Clears all authentication and session cookies.
 *     tags:
 *       - Authentication
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Logged out successfully
 */
router.post("/logout", logout);
/**
 * @swagger
 * /api/v1/auth/verify-email/{token}:
 *   get:
 *     summary: Verify email address
 *     description: Verifies a user's email using the token sent in the verification email. Redirects to the frontend on success.
 *     tags:
 *       - Authentication
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Email verification token
 *     responses:
 *       302:
 *         description: Redirects to frontend profile page on success, or login page on failure.
 */
router.get("/verify-email/:token", verifyEmail);

/**
 * @swagger
 * /api/v1/auth/complete-profile:
 *   post:
 *     summary: Complete user profile after email verification
 *     description: Sets firstName, lastName, department, titles, and orgName. Requires a verifyToken cookie or x-verify-token header.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *               department:
 *                 type: string
 *                 example: Engineering
 *               titles:
 *                 type: string
 *                 example: Senior Engineer
 *               orgName:
 *                 type: string
 *                 description: Required for admin role only
 *                 example: Acme Corp
 *     responses:
 *       200:
 *         description: Profile completed successfully
 *       400:
 *         description: Missing data or organization already exists
 *       401:
 *         description: Verification session expired
 *       500:
 *         description: Internal server error
 */
router.post("/complete-profile", completeProfile);

/**
 * @swagger
 * /api/v1/auth/forgot-password:
 *   post:
 *     summary: Request a password reset email
 *     description: Sends a password reset link to the user's email address if it exists.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@example.com
 *     responses:
 *       200:
 *         description: Returns a generic message regardless of whether the email exists (security measure)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: If exists, email sent
 */
router.post("/forgot-password", forgotPassword);

/**
 * @swagger
 * /api/v1/auth/reset-password/{token}:
 *   get:
 *     summary: Validate reset token and redirect to new-password page
 *     description: Validates the password reset token, sets a resetToken cookie, and redirects to the frontend new-password page.
 *     tags:
 *       - Authentication
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Password reset token from the email link
 *     responses:
 *       302:
 *         description: Redirects to the frontend new-password page on success, or login page on failure.
 */
router.get("/reset-password/:token", resetPasswordRedirect);

/**
 * @swagger
 * /api/v1/auth/reset-password:
 *   post:
 *     summary: Reset password using the reset token cookie
 *     description: Resets the user's password. Requires a valid resetToken cookie set by the GET /reset-password/:token redirect.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "NewSecureP@ss123"
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Reset token expired or invalid
 *       500:
 *         description: Server error
 */
router.post("/reset-password", resetPassword);

/**
 * @swagger
 * /api/v1/auth/change-password:
 *   post:
 *     summary: Change password while logged in
 *     description: Allows an authenticated user to change their password by providing the old and new password.
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 format: password
 *                 example: "OldP@ss123"
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: "NewP@ss456"
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       400:
 *         description: Old password is incorrect or same as new
 *       401:
 *         description: Unauthorized
 */
router.post("/change-password", protect, changePassword);

/**
 * @swagger
 * /api/v1/auth/resend-verification-email:
 *   post:
 *     summary: Resend email verification link
 *     description: Resends the verification email to the user.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@example.com
 *     responses:
 *       200:
 *         description: Verification email resent successfully
 *       400:
 *         description: User not found or already verified
 */
router.post("/resend-verification-email", resendVerificationEmail);

/**
 * @swagger
 * /api/v1/auth/current-user-session:
 *   get:
 *     summary: Get the current registration session info
 *     description: Returns inherited orgName, department, and allowed departments for the user completing their profile. Requires verifyToken cookie or x-verify-token header.
 *     tags:
 *       - Authentication
 *     responses:
 *       200:
 *         description: Session data returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 email:
 *                   type: string
 *                 role:
 *                   type: string
 *                 inheritedOrgName:
 *                   type: string
 *                 department:
 *                   type: string
 *                 allowedDepartments:
 *                   type: array
 *                   items:
 *                     type: string
 *       401:
 *         description: No verification session found or invalid token
 */
router.get("/current-user-session", getCurrentUserSession);

/**
 * @swagger
 * /api/v1/auth/organizations:
 *   get:
 *     summary: Get list of all organization names
 *     description: Returns a list of all registered organization names. Requires authentication.
 *     tags:
 *       - Organizations
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of organization names
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 organizations:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["Acme Corp", "Beta Inc"]
 */
router.get("/organizations", protect, getAllOrganizations);

/**
 * @swagger
 * /api/v1/auth/organization/{name}:
 *   get:
 *     summary: Get members of a specific organization
 *     description: Returns all users belonging to an organization by its name.
 *     tags:
 *       - Organizations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Organization name
 *         example: Acme Corp
 *     responses:
 *       200:
 *         description: List of members returned
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Organization not found
 */
router.get("/organization/:name", protect, getOrganizationMembers);

/**
 * @swagger
 * /api/v1/auth/organization-filters/{name}:
 *   get:
 *     summary: Get filter options for an organization
 *     description: Returns filterable metadata (departments, roles, etc.) for a specific organization.
 *     tags:
 *       - Organizations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Organization name
 *         example: Acme Corp
 *     responses:
 *       200:
 *         description: Organization filter data returned
 *       401:
 *         description: Unauthorized
 */
router.get("/organization-filters/:name", protect, getOrganizationFilters);

// Invitation Routes
/**
 * @swagger
 * /api/v1/auth/send-invitation:
 *   post:
 *     summary: Send an invitation to a new user
 *     description: Sends an email invitation to a specified email address with a specific role and organization.
 *     tags:
 *       - Invitations
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: newuser@example.com
 *               role:
 *                 type: string
 *                 enum: [employee, leader, manager, admin]
 *                 example: employee
 *               department:
 *                 type: string
 *                 example: Engineering
 *               orgName:
 *                 type: string
 *                 example: Acme Corp
 *     responses:
 *       201:
 *         description: Invitation sent successfully
 *       400:
 *         description: User already exists or invalid data
 *       401:
 *         description: Unauthorized
 */
router.post("/send-invitation", protect, sendInvitation);

/**
 * @swagger
 * /api/v1/auth/invite/{token}:
 *   get:
 *     summary: Accept an invitation via token link
 *     description: Validates the invitation token and redirects the user to the registration page.
 *     tags:
 *       - Invitations
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Invitation token from the email link
 *     responses:
 *       302:
 *         description: Redirects to registration page or error page
 */
router.get("/invite/:token", acceptInvitation);

/**
 * @swagger
 * /api/v1/auth/invitations:
 *   get:
 *     summary: Get all invitations sent by the current user
 *     description: Returns a list of all invitations created by the authenticated user.
 *     tags:
 *       - Invitations
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of invitations returned
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   email:
 *                     type: string
 *                   role:
 *                     type: string
 *                   used:
 *                     type: boolean
 *                   expiredAt:
 *                     type: string
 *                     format: date-time
 */
router.get("/invitations", protect, getInvitations);

/**
 * @swagger
 * /api/v1/auth/invitation/{id}:
 *   delete:
 *     summary: Delete an invitation
 *     description: Permanently deletes an invitation by its ID.
 *     tags:
 *       - Invitations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Invitation ID
 *     responses:
 *       200:
 *         description: Invitation deleted successfully
 *       404:
 *         description: Invitation not found
 */
router.delete("/invitation/:id", protect, deleteInvitation);

/**
 * @swagger
 * /api/v1/auth/reset-assessment/{id}:
 *   delete:
 *     summary: Reset a user's assessment
 *     description: Soft-deletes the user's in-progress or completed assessment, allowing them to retake it.
 *     tags:
 *       - Invitations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Invitation ID for the user whose assessment should be reset
 *     responses:
 *       200:
 *         description: Assessment reset successfully
 *       404:
 *         description: Invitation not found
 */
router.delete("/reset-assessment/:id", protect, resetAssessment);

/**
 * @swagger
 * /api/v1/auth/send-bulk-invitation:
 *   post:
 *     summary: Send bulk invitations via CSV file upload
 *     description: Upload a CSV file containing a list of emails and roles to invite multiple users at once.
 *     tags:
 *       - Invitations
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: CSV file with columns - email, role, department
 *     responses:
 *       200:
 *         description: Bulk invitations sent successfully
 *       400:
 *         description: Invalid file or data format
 *       401:
 *         description: Unauthorized
 */
router.post("/send-bulk-invitation", protect, uploadCSV, sendBulkInvitations);

/**
 * @swagger
 * /api/v1/auth/invitation-details/{token}:
 *   get:
 *     summary: Get details of an invitation by token
 *     description: Returns full details of an invitation including role, orgName, and department. Used publicly before registration.
 *     tags:
 *       - Invitations
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Invitation token
 *     responses:
 *       200:
 *         description: Invitation details returned
 *       404:
 *         description: Invalid or expired invitation token
 */
router.get("/invitation-details/:token", getInvitationDetails);

// User Routes
/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Get current authenticated user session details
 *     description: Returns details of the logged in user or guest (via invite token).
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User session details retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   example: 60d21b4667d0d8992e610c85
 *                 firstName:
 *                   type: string
 *                   example: John
 *                 lastName:
 *                   type: string
 *                   example: Doe
 *                 role:
 *                   type: string
 *                   example: employee
 *                 orgName:
 *                   type: string
 *                   example: Acme Corp
 *                 orgLogo:
 *                   type: string
 *                   example: "https://cloudinary.com/logo.png"
 *                 isGuest:
 *                   type: boolean
 *                   example: false
 *                 assessmentStatus:
 *                   type: string
 *                   enum: [NOT_REQUIRED, PENDING, DUE, COMPLETED]
 *                   example: COMPLETED
 *       401:
 *         description: Unauthorized. Session expired or missing tokens.
 *       404:
 *         description: User not found.
 */
router.get("/me", flexibleProtect, getMe);

/**
 * @swagger
 * /api/v1/auth/my-profile:
 *   get:
 *     summary: Get detailed user profile with assessment history
 *     description: Returns full user profile including scores, assessment history, and feedback. Accessible by logged-in users and guests via invite token.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile data returned successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get("/my-profile", flexibleProtect, myProfile);

/**
 * @swagger
 * /api/v1/auth/update-profile:
 *   patch:
 *     summary: Update user profile with optional image uploads
 *     description: Updates first name, last name, department, titles, orgName, and optionally uploads a profile image or org logo.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *               department:
 *                 type: string
 *                 example: Engineering
 *               titles:
 *                 type: string
 *                 example: Senior Engineer
 *               profileImage:
 *                 type: string
 *                 format: binary
 *                 description: Profile picture (optional)
 *               orgLogo:
 *                 type: string
 *                 format: binary
 *                 description: Organization logo (optional, admin only)
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.patch(
  "/update-profile",
  protect,
  upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "orgLogo", maxCount: 1 }
  ]),
  updateProfile
);

// Notifications routes
/**
 * @swagger
 * /api/v1/auth/notifications:
 *   get:
 *     summary: Get all notifications for the current user
 *     description: Returns a list of all notifications for the authenticated user, ordered by most recent.
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of notifications returned
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   title:
 *                     type: string
 *                   message:
 *                     type: string
 *                   type:
 *                     type: string
 *                     enum: [info, success, warning, error]
 *                   isRead:
 *                     type: boolean
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 */
router.get("/notifications", protect, getNotifications);

/**
 * @swagger
 * /api/v1/auth/notifications/{id}/read:
 *   patch:
 *     summary: Mark a notification as read
 *     description: Marks a single notification as read by its ID.
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       404:
 *         description: Notification not found
 */
router.patch("/notifications/:id/read", protect, markAsRead);

/**
 * @swagger
 * /api/v1/auth/notifications/read-all:
 *   patch:
 *     summary: Mark all notifications as read
 *     description: Marks all notifications of the current user as read.
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
router.patch("/notifications/read-all", protect, markAllAsRead);

/**
 * @swagger
 * /api/v1/auth/notifications/clear-all:
 *   delete:
 *     summary: Clear all notifications
 *     description: Deletes all notifications for the authenticated user.
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications cleared
 */
router.delete("/notifications/clear-all", protect, clearNotifications);

// Preferences
/**
 * @swagger
 * /api/v1/auth/update-notifications:
 *   patch:
 *     summary: Update notification preferences
 *     description: Updates the current user's notification preference settings (e.g. email notifications, push notifications).
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               emailNotifications:
 *                 type: boolean
 *                 example: true
 *               pushNotifications:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Notification preferences updated successfully
 *       401:
 *         description: Unauthorized
 */
router.patch("/update-notifications", protect, updateNotificationPreferences);

export default router;
