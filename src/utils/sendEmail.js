import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD
  }
});

export const sendVerificationEmail = async (user, link) => {
  await transporter.sendMail({
    from: `"Talent By Design" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: "Verify your email to get started with Talent By Design",
    html: `
      <div style="background:#f4f6f8;padding:40px 0;font-family:Arial,Helvetica,sans-serif;">
        <div style="max-width:600px;margin:0 auto;background:#ffffff;
                    border-radius:8px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">

          <!-- Header -->
          <div style="background:#1976d2;padding:24px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:24px;">
              Talent By Design
            </h1>
          </div>

          <!-- Body -->
          <div style="padding:32px;color:#333333;">
            <h2 style="margin-top:0;font-size:20px;">
              Welcome 👋
            </h2>

            <p style="font-size:15px;line-height:1.6;">
              Thanks for joining <strong>Talent By Design</strong>.
              To complete your registration and access your profile,
              please verify your email address.
            </p>

            <!-- CTA Button -->
            <div style="text-align:center;margin:32px 0;">
              <a href="${link}"
                 style="
                   display:inline-block;
                   padding:14px 32px;
                   background:#1976d2;
                   color:#ffffff;
                   text-decoration:none;
                   border-radius:6px;
                   font-size:15px;
                   font-weight:bold;
                 ">
                Verify Email
              </a>
            </div>

            <p style="font-size:14px;color:#555555;">
              This verification link will expire in <strong>15 minutes</strong>.
              If it expires, you can request a new one from the login page.
            </p>

            <p style="font-size:14px;margin-top:32px;">
              We’re excited to have you onboard 🚀  
              <br />
              <strong>The Talent By Design Team</strong>
            </p>
          </div>

          <!-- Footer -->
          <div style="background:#f0f2f5;padding:16px;text-align:center;font-size:12px;color:#777;">
            <p style="margin:0;">
              If you didn’t create an account with Talent By Design,
              you can safely ignore this email.
            </p>
          </div>

        </div>
      </div>
    `
  });
};


export const sendResetEmail = async (to, link) => {
  await transporter.sendMail({
    from: `"Talent By Design" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Reset your Talent By Design password",
    html: `
      <div style="background:#f4f6f8;padding:40px 0;font-family:Arial,Helvetica,sans-serif;">
        <div style="max-width:600px;margin:0 auto;background:#ffffff;
                    border-radius:8px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">

          <!-- Header -->
          <div style="background:#1976d2;padding:24px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:24px;">
              Talent By Design
            </h1>
          </div>

          <!-- Body -->
          <div style="padding:32px;color:#333333;">
            <h2 style="margin-top:0;font-size:20px;">
              Reset your password
            </h2>

            <p style="font-size:15px;line-height:1.6;">
              We received a request to reset the password for your
              <strong>Talent By Design</strong> account.
            </p>

            <p style="font-size:15px;line-height:1.6;">
              Click the button below to set a new password. If you did not
              request a password reset, you can safely ignore this email.
            </p>

            <!-- CTA Button -->
            <div style="text-align:center;margin:32px 0;">
              <a href="${link}"
                 style="
                   display:inline-block;
                   padding:14px 32px;
                   background:#1976d2;
                   color:#ffffff;
                   text-decoration:none;
                   border-radius:6px;
                   font-size:15px;
                   font-weight:bold;
                 ">
                Reset Password
              </a>
            </div>

            <p style="font-size:14px;color:#555555;">
              This password reset link will expire in <strong>15 minutes</strong>.
              If it expires, you can request a new one from the login page.
            </p>

            <p style="font-size:14px;margin-top:32px;">
              <strong>The Talent By Design Team</strong>
            </p>
          </div>

          <!-- Footer -->
          <div style="background:#f0f2f5;padding:16px;text-align:center;font-size:12px;color:#777;">
            <p style="margin:0;">
              If you didn’t request a password reset, no further action is required.
            </p>
          </div>

        </div>
      </div>
    `
  });
};
