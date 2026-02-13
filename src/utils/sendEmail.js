import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  }
});

/**
 * Base Email Wrapper for a professional look
 */
const getEmailWrapper = (title, content) => `
  <div style="background-color: #f8fafc; padding: 40px 20px; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.5;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0;">
      <!-- Header with Gradient-like blue -->
      <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); background-color: #1e40af; padding: 32px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.025em;">
          Talent By Design
        </h1>
      </div>
      
      <!-- Main Content -->
      <div style="padding: 40px 32px;">
        <h2 style="margin-top: 0; color: #0f172a; font-size: 22px; font-weight: 700; margin-bottom: 20px;">
          ${title}
        </h2>
        ${content}
        
        <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #f1f5f9; color: #64748b; font-size: 14px;">
          Best regards,<br />
          <strong style="color: #1e40af;">The Talent By Design Team</strong>
        </div>
      </div>
      
      <!-- Footer -->
      <div style="background-color: #f1f5f9; padding: 24px; text-align: center; font-size: 12px; color: #94a3b8;">
        <p style="margin: 0 0 8px 0;">&copy; ${new Date().getFullYear()} Talent By Design. All rights reserved.</p>
        <p style="margin: 0;">You received this email because it's required for your account or activity on our platform.</p>
      </div>
    </div>
  </div>
`;

const sendEmail = async (mailOptions) => {
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email.');
  }
};

export const sendInvitationEmail = async (email, link, role, orgName) => {
  if (!email || !link) return;

  const isEmployee = role === 'employee';
  const title = isEmployee ? "Your Assessment Invitation" : "You're Invited to Join";
  const buttonText = isEmployee ? "Start Assessment" : "Complete Registration";

  const content = `
    <p style="font-size: 16px; margin-bottom: 24px;">
      Hello,
    </p>
    <p style="font-size: 16px; margin-bottom: 16px;">
      You have been invited to join <strong>${orgName || 'the platform'}</strong> on Talent By Design. 
      ${isEmployee
      ? "We're excited to have you complete your confidential professional assessment."
      : "You have been assigned administrative access to help manage your organization's talent growth."}
    </p>
    <div style="text-align: center; margin: 40px 0;">
      <a href="${link}" style="display: inline-block; padding: 16px 36px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 12px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2);">
        ${buttonText}
      </a>
    </div>
    <p style="font-size: 14px; color: #64748b; font-style: italic;">
      Note: This invitation link is personal to you and will expire in 1 hour.
    </p>
  `;

  await sendEmail({
    from: `"Talent By Design" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: title,
    html: getEmailWrapper(title + " 🚀", content)
  });
};

export const sendVerificationEmail = async (user, link) => {
  if (!user?.email || !link) return;

  const title = "Welcome to Talent By Design";
  const content = `
    <p style="font-size: 16px; margin-bottom: 24px;">
      Welcome aboard!
    </p>
    <p style="font-size: 16px; margin-bottom: 16px;">
      We're thrilled to have you join our community. To finalize your account setup and ensure the security of your information, please verify your email address by clicking the button below:
    </p>
    <div style="text-align: center; margin: 40px 0;">
      <a href="${link}" style="display: inline-block; padding: 16px 36px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 12px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2);">
        Verify Email Address
      </a>
    </div>
    <p style="font-size: 14px; color: #64748b;">
      This link will remain active for 15 minutes. If you didn't create an account, you can safely ignore this email.
    </p>
  `;

  await sendEmail({
    from: `"Talent By Design" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: "Verify your email address",
    html: getEmailWrapper("Let's get started 👋", content)
  });
};

export const sendResetEmail = async (to, link) => {
  if (!to || !link) return;

  const title = "Reset Your Password";
  const content = `
    <p style="font-size: 16px; margin-bottom: 24px;">
      Hello,
    </p>
    <p style="font-size: 16px; margin-bottom: 16px;">
      We received a request to reset the password for your Talent By Design account. No changes have been made yet. You can reset your password by clicking the link below:
    </p>
    <div style="text-align: center; margin: 40px 0;">
      <a href="${link}" style="display: inline-block; padding: 16px 36px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 12px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2);">
        Reset Password
      </a>
    </div>
    <p style="font-size: 14px; color: #64748b;">
      For security reasons, this link will expire in 15 minutes. If you did not request this, please ignore this email or contact support if you have concerns.
    </p>
  `;

  await sendEmail({
    from: `"Talent By Design" <${process.env.EMAIL_USER}>`,
    to,
    subject: title,
    html: getEmailWrapper(title, content)
  });
};

export const sendNotificationEmail = async (user, title, message) => {
  if (!user?.email) return;

  const content = `
    <p style="font-size: 16px; margin-bottom: 24px;">
      ${message}
    </p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${process.env.FRONTEND_URL}/dashboard" style="display: inline-block; padding: 12px 28px; background-color: #f1f5f9; color: #1e40af; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 600; border: 1px solid #e2e8f0;">
        Go to Dashboard
      </a>
    </div>
    <p style="font-size: 13px; color: #94a3b8; font-style: italic;">
      You received this because you have email notifications enabled in your profile settings.
    </p>
  `;

  await sendEmail({
    from: `"Talent By Design" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: title,
    html: getEmailWrapper(title, content)
  });
};
