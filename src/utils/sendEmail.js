import nodemailer from 'nodemailer';

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  }
});

const LOGO_URL = 'https://res.cloudinary.com/dfpkn8g8h/image/upload/v1772686244/talent-by-design/talent-by-design-logo.png';
const HERO_BANNER_URL = 'https://res.cloudinary.com/dfpkn8g8h/image/upload/v1772685687/talent-by-design/talent-by-design-hero.png';

const heroBannerAttachment = {
  filename: 'hero-banner.png',
  path: HERO_BANNER_URL,
  cid: 'heroBanner'
};

const getEmailWrapper = (firstName, content) => `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Talent By Design</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse !important; }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f4f4f4; }
    @media screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .content-padding { padding: 30px 20px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td align="center" style="padding: 20px 0; background-color: #f4f4f4;">

        <table border="0" cellpadding="0" cellspacing="0" width="600" class="container" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">

          <!-- LOGO ROW -->
          <tr>
            <td align="left" style="padding: 25px 40px;">
              <img src="${LOGO_URL}" alt="Talent By Design" width="200" style="display: block; width: 200px;" />
            </td>
          </tr>

          <!-- HERO BANNER ROW -->
          <tr>
            <td align="left" valign="middle" style="padding: 35px 24px; background-color: #2e10ff; background-image: url('cid:heroBanner'); background-size: contain; background-position: right; background-repeat: no-repeat;">
              <h1 style="color: #ffffff; font-family: Arial, sans-serif; font-size: 28px; font-weight: bold; margin: 0; line-height: 40px;">
                Hi there,<br />${firstName || 'there'}!
              </h1>
            </td>
          </tr>

          <!-- BODY CONTENT ROW -->
          <tr>
            <td align="left" class="content-padding" style="padding: 50px 40px; color: #333333; font-family: Arial, sans-serif; font-size: 16px; line-height: 24px;">
              ${content}
              <p style="margin: 20px 0 0 0;">Thanks,<br /><strong>The Talent By Design Team</strong></p>
            </td>
          </tr>

          <!-- FOOTER ROW -->
          <tr>
            <td style="padding: 0 20px 20px 20px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#2e10ff" style="border-radius: 4px;">
                <tr>
                  <td style="padding: 40px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td align="left">
                          <span style="color: #ffffff; font-family: Arial; font-size: 20px; font-weight: bold;">Talent By Design</span>
                        </td>
                        <td align="right">
                          <table border="0" cellpadding="0" cellspacing="0">
                            <tr>
                              <!-- Facebook -->
                              <td style="padding-left: 10px;">
                                <a href="#">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 256 256">
                                    <path fill="#1877f2" d="M256 128C256 57.308 198.692 0 128 0S0 57.308 0 128c0 63.888 46.808 116.843 108 126.445V165H75.5v-37H108V99.8c0-32.08 19.11-49.8 48.348-49.8C170.352 50 185 52.5 185 52.5V84h-16.14C152.959 84 148 93.867 148 103.99V128h35.5l-5.675 37H148v89.445c61.192-9.602 108-62.556 108-126.445"/>
                                    <path fill="#fff" d="m177.825 165l5.675-37H148v-24.01C148 93.866 152.959 84 168.86 84H185V52.5S170.352 50 156.347 50C127.11 50 108 67.72 108 99.8V128H75.5v37H108v89.445A129 129 0 0 0 128 256a129 129 0 0 0 20-1.555V165z"/>
                                  </svg>
                                </a>
                              </td>
                              <!-- Instagram -->
                              <td style="padding-left: 10px;">
                                <a href="#">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 256 256">
                                    <g fill="none">
                                      <rect width="25" height="25" fill="url(#ig1)" rx="60"/>
                                      <rect width="25" height="25" fill="url(#ig2)" rx="60"/>
                                      <path fill="#fff" d="M128.009 28c-27.158 0-30.567.119-41.233.604c-10.646.488-17.913 2.173-24.271 4.646c-6.578 2.554-12.157 5.971-17.715 11.531c-5.563 5.559-8.98 11.138-11.542 17.713c-2.48 6.36-4.167 13.63-4.646 24.271c-.477 10.667-.602 14.077-.602 41.236s.12 30.557.604 41.223c.49 10.646 2.175 17.913 4.646 24.271c2.556 6.578 5.973 12.157 11.533 17.715c5.557 5.563 11.136 8.988 17.709 11.542c6.363 2.473 13.631 4.158 24.275 4.646c10.667.485 14.073.604 41.23.604c27.161 0 30.559-.119 41.225-.604c10.646-.488 17.921-2.173 24.284-4.646c6.575-2.554 12.146-5.979 17.702-11.542c5.563-5.558 8.979-11.137 11.542-17.712c2.458-6.361 4.146-13.63 4.646-24.272c.479-10.666.604-14.066.604-41.225s-.125-30.567-.604-41.234c-.5-10.646-2.188-17.912-4.646-24.27c-2.563-6.578-5.979-12.157-11.542-17.716c-5.562-5.562-11.125-8.979-17.708-11.53c-6.375-2.474-13.646-4.16-24.292-4.647c-10.667-.485-14.063-.604-41.23-.604zm-8.971 18.021c2.663-.004 5.634 0 8.971 0c26.701 0 29.865.096 40.409.575c9.75.446 15.042 2.075 18.567 3.444c4.667 1.812 7.994 3.979 11.492 7.48c3.5 3.5 5.666 6.833 7.483 11.5c1.369 3.52 3 8.812 3.444 18.562c.479 10.542.583 13.708.583 40.396s-.104 29.855-.583 40.396c-.446 9.75-2.075 15.042-3.444 18.563c-1.812 4.667-3.983 7.99-7.483 11.488c-3.5 3.5-6.823 5.666-11.492 7.479c-3.521 1.375-8.817 3-18.567 3.446c-10.542.479-13.708.583-40.409.583c-26.702 0-29.867-.104-40.408-.583c-9.75-.45-15.042-2.079-18.57-3.448c-4.666-1.813-8-3.979-11.5-7.479s-5.666-6.825-7.483-11.494c-1.369-3.521-3-8.813-3.444-18.563c-.479-10.542-.575-13.708-.575-40.413s.096-29.854.575-40.396c.446-9.75 2.075-15.042 3.444-18.567c1.813-4.667 3.983-8 7.484-11.5s6.833-5.667 11.5-7.483c3.525-1.375 8.819-3 18.569-3.448c9.225-.417 12.8-.542 31.437-.563zm62.351 16.604c-6.625 0-12 5.37-12 11.996c0 6.625 5.375 12 12 12s12-5.375 12-12s-5.375-12-12-12zm-53.38 14.021c-28.36 0-51.354 22.994-51.354 51.355s22.994 51.344 51.354 51.344c28.361 0 51.347-22.983 51.347-51.344c0-28.36-22.988-51.355-51.349-51.355zm0 18.021c18.409 0 33.334 14.923 33.334 33.334c0 18.409-14.925 33.334-33.334 33.334s-33.333-14.925-33.333-33.334c0-18.411 14.923-33.334 33.333-33.334"/>
                                      <defs>
                                        <radialGradient id="ig1" cx="0" cy="0" r="1" gradientTransform="matrix(0 -253.715 235.975 0 68 275.717)" gradientUnits="userSpaceOnUse">
                                          <stop stop-color="#fd5"/><stop offset=".1" stop-color="#fd5"/><stop offset=".5" stop-color="#ff543e"/><stop offset="1" stop-color="#c837ab"/>
                                        </radialGradient>
                                        <radialGradient id="ig2" cx="0" cy="0" r="1" gradientTransform="rotate(78.68 -32.69 -16.937)scale(113.412 467.488)" gradientUnits="userSpaceOnUse">
                                          <stop stop-color="#3771c8"/><stop offset=".128" stop-color="#3771c8"/><stop offset="1" stop-color="#60f" stop-opacity="0"/>
                                        </radialGradient>
                                      </defs>
                                    </g>
                                  </svg>
                                </a>
                              </td>
                              <!-- X / Twitter -->
                              <td style="padding-left: 10px;">
                                <a href="#">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 14 14">
                                    <g fill="none"><g clip-path="url(#tw)">
                                      <path fill="#ffffff" d="M11.025.656h2.147L8.482 6.03L14 13.344H9.68L6.294 8.909l-3.87 4.435H.275l5.016-5.75L0 .657h4.43L7.486 4.71zm-.755 11.4h1.19L3.78 1.877H2.504z"/>
                                    </g><defs><clipPath id="tw"><path fill="#fff" d="M0 0h14v14H0z"/></clipPath></defs></g>
                                  </svg>
                                </a>
                              </td>
                              <!-- LinkedIn -->
                              <td style="padding-left: 10px;">
                                <a href="#">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 1024 1024">
                                    <path fill="#ffffff" d="M847.7 112H176.3c-35.5 0-64.3 28.8-64.3 64.3v671.4c0 35.5 28.8 64.3 64.3 64.3h671.4c35.5 0 64.3-28.8 64.3-64.3V176.3c0-35.5-28.8-64.3-64.3-64.3m0 736q-671.7-.15-671.7-.3q.15-671.7.3-671.7q671.7.15 671.7.3q-.15 671.7-.3 671.7M230.6 411.9h118.7v381.8H230.6zm59.4-52.2c37.9 0 68.8-30.8 68.8-68.8a68.8 68.8 0 1 0-137.6 0c-.1 38 30.7 68.8 68.8 68.8m252.3 245.1c0-49.8 9.5-98 71.2-98c60.8 0 61.7 56.9 61.7 101.2v185.7h118.6V584.3c0-102.8-22.2-181.9-142.3-181.9c-57.7 0-96.4 31.7-112.3 61.7h-1.6v-52.2H423.7v381.8h118.6z"/>
                                  </svg>
                                </a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding-top: 30px; border-bottom: 1px solid rgba(255,255,255,0.2);"></td>
                      </tr>
                      <tr>
                        <td colspan="2" align="center" style="padding-top: 30px; color: #ffffff; font-family: Arial, sans-serif; font-size: 12px; line-height: 18px;">
                          You received this email because it's required for your account or activity on Talent By Design.<br /><br />
                          Copyright &copy; ${new Date().getFullYear()}. All Rights Reserved
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

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

  // You have been invited to join <strong>${orgName || 'the platform'}</strong> on Talent By Design. 
  const content = `
    <p style="font-size: 16px; margin-bottom: 16px;">

      You have been invited to participate in <strong> Talent By Design's POD-360™ </strong> Workplace Assessment.  We thank you in advance for your time and look forward to supporting you along your journey
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
    html: getEmailWrapper('', content),
    attachments: [heroBannerAttachment]
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
    html: getEmailWrapper(user.firstName || '', content),
    attachments: [heroBannerAttachment]
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
    html: getEmailWrapper('', content),
    attachments: [heroBannerAttachment]
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
    html: getEmailWrapper(user.firstName || '', content),
    attachments: [heroBannerAttachment]
  });
};
