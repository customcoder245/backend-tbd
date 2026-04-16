import nodemailer from "nodemailer";
import dns from "dns";

// Force prioritize IPv4 for network requests (fixes Gmail connection timeouts on many networks)
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}

let transporter;

const getTransporter = () => {
  if (!transporter) {
    // This allows you to switch between Gmail (low limit) 
    // and professional services like Resend/SendGrid (high limit)
    // without changing any code, just based on your .env variables.
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: parseInt(process.env.EMAIL_PORT) || 465,
      secure: process.env.EMAIL_SECURE !== "false", // default to true (port 465)
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }
  return transporter;
};

const LOGO_URL =
  "https://res.cloudinary.com/dfpkn8g8h/image/upload/v1772775850/talent-by-design/email-assets/logo.png";
const FOOTER_LOGO_URL =
  "https://res.cloudinary.com/dfpkn8g8h/image/upload/v1772775853/talent-by-design/email-assets/footer-logo.png";
const FB_ICON_URL =
  "https://res.cloudinary.com/dfpkn8g8h/image/upload/v1772775855/talent-by-design/email-assets/fb.png";
const INSTA_ICON_URL =
  "https://res.cloudinary.com/dfpkn8g8h/image/upload/v1772775857/talent-by-design/email-assets/insta.png";
const TWITTER_ICON_URL =
  "https://res.cloudinary.com/dfpkn8g8h/image/upload/v1772775859/talent-by-design/email-assets/twitter.png";
const LINKEDIN_ICON_URL =
  "https://res.cloudinary.com/dfpkn8g8h/image/upload/v1772775861/talent-by-design/email-assets/linkedin.png";
const HERO_IMAGE_URL =
  "https://res.cloudinary.com/dfpkn8g8h/image/upload/v1772775862/talent-by-design/email-assets/hero-banner.png";

const getEmailWrapper = (
  firstName,
  content,
) => `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Quicksand:wght@300..700&display=swap"
      rel="stylesheet"
    />
    <title>Talent By Design</title>
    <style type="text/css">
      body,
      table,
      td,
      a {
        -webkit-text-size-adjust: 100%;
        -ms-text-size-adjust: 100%;
        font-family: "Quicksand", sans-serif;
      }
      table,
      td {
        mso-table-lspace: 0pt;
        mso-table-rspace: 0pt;
        border-collapse: collapse !important;
      }
      img {
        border: 0;
        height: auto;
        line-height: 100%;
        outline: none;
        text-decoration: none;
        -ms-interpolation-mode: bicubic;
      }
      body {
        height: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        background-color: #f4f4f4;
      }
 
      @media screen and (max-width: 600px) {
        .container {
          width: 100% !important;
        }
        .content-padding {
          padding: 30px 20px !important;
        }
      }
    </style>
  </head>
  <body style="margin: 0; padding: 0">
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center" style="padding: 20px 0; background-color: #f4f4f4">
          <table
            border="0"
            cellpadding="0"
            cellspacing="0"
            width="600"
            class="container"
            style="
              background-color: #ffffff;
              /* border-radius: 8px; */
              border: #f5f5f5 1px solid;
              overflow: hidden;
            "
          >
            <!-- LOGO ROW -->
            <tr>
              <td align="left" style="padding: 12px 24px">
                <img
                  src="${LOGO_URL}"
                  alt="Talent By Design"
                  width="100"
                  style="display: block; width: 100px"
                />
              </td>
            </tr>
 
            <!-- HERO BANNER ROW -->
            <tr>
              <td
                align="left"
                bgcolor="#448cd2"
                style="padding: 0; background-color: #448cd2;"
              >
                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td align="left" valign="middle" style="padding: 60px 24px;">
                      <h1
                        style="
                          color: #ffffff;
                          font-size: 28px;
                          font-weight: bold;
                          margin: 0;
                          line-height: 40px;
                        "
                      >
                        Hi ${firstName || "there"}!
                      </h1>
                    </td>
                    <td align="right" valign="bottom" style="padding: 0;">
                      <img
                        src="${HERO_IMAGE_URL}"
                        alt="Join Us"
                        width="250"
                        style="display: block; width: 250px; max-width: 100%; border: 0;"
                      />
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
 
            <!-- BODY CONTENT ROW -->
            <tr>
              <td
                align="left"
                class="content-padding"
                style="
                  padding: 50px 40px;
                  color: #333333;
                  font-size: 16px;
                  line-height: 24px;
                "
              >
                ${content}
                <p style="margin: 20px 0 0 0; font-size: 14px">
                  Thanks,<br /><strong style="font-size: 16px"
                    >Team Talent By Design</strong
                  >
                </p>
              </td>
            </tr>
 
            <!-- FOOTER ROW -->
            <tr>
              <td style="padding: 0 20px 20px 20px">
                <table
                  border="0"
                  cellpadding="0"
                  cellspacing="0"
                  width="100%"
                  bgcolor="#448CD2"
                >
                  <tr>
                    <td style="padding: 24px">
                      <table
                        border="0"
                        cellpadding="0"
                        cellspacing="0"
                        width="100%"
                      >
                        <tr>
                          <td align="left">
                            <img
                              src="${FOOTER_LOGO_URL}"
                              alt="Talent By Design"
                              width="100"
                              style="display: block; width: 100px"
                            />
                          </td>
                          <td align="right">
                            <table border="0" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="padding-left: 10px">
                                  <a href="#">
                                    <img
                                      src="${FB_ICON_URL}"
                                      alt="Fb"
                                      width="24"
                                      height="24"
                                      style="display: block; width: 24px; height: 24px; border: 0;"
                                    />
                                  </a>
                                </td>
                                <td style="padding-left: 10px">
                                  <a href="#">
                                    <img
                                      src="${INSTA_ICON_URL}"
                                      alt="Insta"
                                      width="24"
                                      height="24"
                                      style="display: block; width: 24px; height: 24px; border: 0;"
                                    />
                                  </a>
                                </td>
                                <td style="padding-left: 10px">
                                  <a href="#">
                                    <img
                                      src="${TWITTER_ICON_URL}"
                                      alt="Twitter"
                                      width="24"
                                      height="24"
                                      style="display: block; width: 24px; height: 24px; border: 0;"
                                    />
                                  </a>
                                </td>
                                <td style="padding-left: 10px">
                                  <a href="#">
                                    <img
                                      src="${LINKEDIN_ICON_URL}"
                                      alt="LinkedIn"
                                      width="24"
                                      height="24"
                                      style="display: block; width: 24px; height: 24px; border: 0;"
                                    />
                                  </a>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td
                            colspan="2"
                            style="
                              padding-top: 20px;
                              border-bottom: 1px solid rgba(255, 255, 255, 0.2);
                            "
                          ></td>
                        </tr>
                        <tr>
                          <td
                            colspan="2"
                            align="center"
                            style="
                              padding-top: 12px;
                              color: #ffffff;
                              font-size: 12px;
                              line-height: 18px;
                            "
                          >
                            © ${new Date().getFullYear()} TALENT BY DESIGN COLLECTIVE Inc. All rights
                            reserved.
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
    const info = await getTransporter().sendMail(mailOptions);
    console.log("Email sent:", info.response);
  } catch (error) {
    console.error(">>> [EMAIL FAIL]:", error.message);
    console.error(error.stack);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};


export const sendInvitationEmail = async (emailOrUser, link, role, orgName) => {
  // 1. Extract email string
  let targetEmail = typeof emailOrUser === "string" ? emailOrUser : emailOrUser?.email;

  // 2. Clear logs and be explicit
  console.log(">>> [PRE-FLIGHT EMAIL CHECK]:", {
    to: targetEmail,
    role: role,
    org: orgName
  });

  if (!targetEmail) {
    throw new Error("sendInvitationEmail: No recipient email provided");
  }

  if (!link) {
    throw new Error("sendInvitationEmail: No invitation link provided");
  }

  const email = targetEmail.trim();

  const isEmployee = role === "employee";
  const title = isEmployee
    ? "Your Assessment Invitation"
    : "You're Invited to Join";
  const buttonText = isEmployee ? "Start Assessment" : "Complete Registration";

  // You have been invited to join <strong>${orgName || 'the platform'}</strong> on Talent By Design.
  const content = `
    <p style="font-size: 16px; margin-bottom: 16px;">

      You have been invited to participate in <strong> Talent By Design's POD-360™ </strong> Workplace Assessment.  We thank you in advance for your time and look forward to supporting you along your journey
      ${isEmployee
      ? "We're excited to have you complete your confidential professional assessment."
      : " "
    }
    </p>
    <div style="margin: 40px 0;">
      <a href="${link}" style="display: inline-block; padding: 12px 28px; background: rgba(68, 140, 210, 0.05); color: #448cd2; text-decoration: none; border-radius: 32px; font-size: 16px; font-weight: 600; border: 1px solid #448cd2; cursor: pointer;">
        ${buttonText}
      </a>
    </div>
    <p style="font-size: 14px; color: #64748b; font-style: italic;">
      Note: This invitation link is personal to you and will expire in ${isEmployee ? "10 hours" : "1 hour"}.
    </p>
  `;

  await sendEmail({
    from: `"Talent By Design" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: title,
    html: getEmailWrapper("", content),
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
    <div style="margin: 40px 0;">
      <a href="${link}" style="display: inline-block; padding: 12px 28px; background: rgba(68, 140, 210, 0.05); color: #448cd2; text-decoration: none; border-radius: 32px; font-size: 16px; font-weight: 600; border: 1px solid #448cd2; cursor: pointer;">
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
    html: getEmailWrapper(user.firstName || "", content),
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
    <div style="margin: 40px 0;">
      <a href="${link}" style="display: inline-block; padding: 12px 28px; background: rgba(68, 140, 210, 0.05); color: #448cd2; text-decoration: none; border-radius: 32px; font-size: 16px; font-weight: 600; border: 1px solid #448cd2; cursor: pointer;">
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
    html: getEmailWrapper("", content),
  });
};

export const sendNotificationEmail = async (user, title, message) => {
  if (!user?.email) return;

  const content = `
    <p style="font-size: 16px; margin-bottom: 24px;">
      ${message}
    </p>
    <div style="margin: 32px 0;">
      <a href="${process.env.FRONTEND_URL}/dashboard" style="display: inline-block; padding: 10px 24px; background: rgba(68, 140, 210, 0.05); color: #448cd2; text-decoration: none; border-radius: 32px; font-size: 14px; font-weight: 600; border: 1px solid #448cd2; cursor: pointer;">
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
    html: getEmailWrapper(user.firstName || "", content),
  });
};

export const sendReportReleasedEmail = async (user, reportType, pdfBuffer = null) => {
  if (!user?.email) return;

  const subject = `Your ${reportType} Report is Ready`;
  const content = `
    <p style="font-size: 16px; margin-bottom: 16px;">
      Your <strong>POD-360™ ${reportType}</strong> assessment report has been officially reviewed and approved by your administrator.
    </p>
    <p style="font-size: 14px; color: #64748b; margin-top: 24px;">
      This report contains your personalized scores, domain insights, objectives and key results, and recommended development programs. We look forward to supporting your ongoing growth journey.
    </p>
    <p style="font-size: 13px; color: #94a3b8; margin-top: 16px; font-style: italic;">
      If you have any questions about your results, please reach out to your organization administrator.
    </p>
  `;

  await sendEmail({
    from: `"Talent By Design" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: subject,
    html: getEmailWrapper(user.firstName || "", content),
    attachments: pdfBuffer ? [{
      filename: `POD360_Report_${(user.firstName || 'Participant').replace(/ /g, '_')}.pdf`,
      content: pdfBuffer,
      contentType: 'application/pdf'
    }] : []
  });
};

export const sendAssessmentResetEmail = async (email, link, firstName, orgName) => {
  const subject = "Your Assessment has been Reset";
  const content = `
    <p style="font-size: 16px; margin-bottom: 16px;">
      Your administrator has reset your <strong>POD-360™</strong> assessment for <strong>${orgName}</strong>.
    </p>
    <p style="font-size: 16px; margin-bottom: 24px;">
      This allows you to take the assessment again. Please click the button below to get started:
    </p>
    <div style="margin: 40px 0;">
      <a href="${link}" style="display: inline-block; padding: 12px 28px; background: rgba(68, 140, 210, 0.05); color: #448cd2; text-decoration: none; border-radius: 32px; font-size: 16px; font-weight: 600; border: 1px solid #448cd2; cursor: pointer;">
        Start Assessment
      </a>
    </div>
    <p style="font-size: 14px; color: #64748b;">
      If you have any questions, please contact your organization administrator.
    </p>
  `;

  await sendEmail({
    from: `"Talent By Design" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: subject,
    html: getEmailWrapper(firstName || "", content),
  });
};
