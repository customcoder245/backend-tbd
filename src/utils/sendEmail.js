// import nodemailer from "nodemailer";

// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_APP_PASSWORD
//   }
// });



// export const sendInvitationEmail = async (email, link) => {
//   await transporter.sendMail({
//     from: `"Talent By Design" <${process.env.EMAIL_USER}>`,
//     to: email,
//     subject: "You are invited to join Talent By Design",
//     html: `
//       <div style="background:#f4f6f8;padding:40px 0;font-family:Arial,Helvetica,sans-serif;">
//         <div style="max-width:600px;margin:0 auto;background:#ffffff;
//                     border-radius:8px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">

//           <!-- Header -->
//           <div style="background:#1976d2;padding:24px;text-align:center;">
//             <h1 style="color:#ffffff;margin:0;font-size:24px;">
//               Talent By Design
//             </h1>
//           </div>

//           <!-- Body -->
//           <div style="padding:32px;color:#333333;">
//             <h2 style="margin-top:0;font-size:20px;">
//               You are invited to join Talent By Design 🚀
//             </h2>

//             <p style="font-size:15px;line-height:1.6;">
//               You have been invited to join the Talent By Design platform.
//               Please click the button below to complete your registration and get started.
//             </p>

//             <p style="font-size:15px;line-height:1.6;">
//               You will be assigned a role as per the invitation details, and you’ll be able to start using your account immediately after completing your registration.
//             </p>

//             <!-- CTA Button -->
//             <div style="text-align:center;margin:32px 0;">
//               <a href="${link}"
//                  style="
//                    display:inline-block;
//                    padding:14px 32px;
//                    background:#1976d2;
//                    color:#ffffff;
//                    text-decoration:none;
//                    border-radius:6px;
//                    font-size:15px;
//                    font-weight:bold;
//                  ">
//                 Complete Registration
//               </a>
//             </div>

//             <p style="font-size:14px;color:#555555;">
//               This invitation link will expire in <strong>1 hour</strong>.
//               If it expires, you can request a new one by contacting the person who invited you.
//             </p>

//             <p style="font-size:14px;margin-top:32px;">
//               We’re excited to have you join us!  
//               <br />
//               <strong>The Talent By Design Team</strong>
//             </p>
//           </div>

//           <!-- Footer -->
//           <div style="background:#f0f2f5;padding:16px;text-align:center;font-size:12px;color:#777;">
//             <p style="margin:0;">
//               If you didn’t receive this invitation, or if you believe this was sent by mistake, you can ignore this email.
//             </p>
//           </div>

//         </div>
//       </div>
//     `,
//   });
// };

// export const sendVerificationEmail = async (user, link) => {
//   await transporter.sendMail({
//     from: `"Talent By Design" <${process.env.EMAIL_USER}>`,
//     to: user.email,
//     subject: "Verify your email to get started with Talent By Design",
//     html: `
//       <div style="background:#f4f6f8;padding:40px 0;font-family:Arial,Helvetica,sans-serif;">
//         <div style="max-width:600px;margin:0 auto;background:#ffffff;
//                     border-radius:8px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">

//           <!-- Header -->
//           <div style="background:#1976d2;padding:24px;text-align:center;">
//             <h1 style="color:#ffffff;margin:0;font-size:24px;">
//               Talent By Design
//             </h1>
//           </div>

//           <!-- Body -->
//           <div style="padding:32px;color:#333333;">
//             <h2 style="margin-top:0;font-size:20px;">
//               Welcome 👋
//             </h2>

//             <p style="font-size:15px;line-height:1.6;">
//               Thanks for joining <strong>Talent By Design</strong>.
//               To complete your registration and access your profile,
//               please verify your email address.
//             </p>

//             <!-- CTA Button -->
//             <div style="text-align:center;margin:32px 0;">
//               <a href="${link}"
//                  style="
//                    display:inline-block;
//                    padding:14px 32px;
//                    background:#1976d2;
//                    color:#ffffff;
//                    text-decoration:none;
//                    border-radius:6px;
//                    font-size:15px;
//                    font-weight:bold;
//                  ">
//                 Verify Email
//               </a>
//             </div>

//             <p style="font-size:14px;color:#555555;">
//               This verification link will expire in <strong>15 minutes</strong>.
//               If it expires, you can request a new one from the login page.
//             </p>

//             <p style="font-size:14px;margin-top:32px;">
//               We’re excited to have you onboard 🚀  
//               <br />
//               <strong>The Talent By Design Team</strong>
//             </p>
//           </div>

//           <!-- Footer -->
//           <div style="background:#f0f2f5;padding:16px;text-align:center;font-size:12px;color:#777;">
//             <p style="margin:0;">
//               If you didn’t create an account with Talent By Design,
//               you can safely ignore this email.
//             </p>
//           </div>

//         </div>
//       </div>
//     `
//   });
// };


// export const sendResetEmail = async (to, link) => {
//   await transporter.sendMail({
//     from: `"Talent By Design" <${process.env.EMAIL_USER}>`,
//     to,
//     subject: "Reset your Talent By Design password",
//     html: `
//       <div style="background:#f4f6f8;padding:40px 0;font-family:Arial,Helvetica,sans-serif;">
//         <div style="max-width:600px;margin:0 auto;background:#ffffff;
//                     border-radius:8px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">

//           <!-- Header -->
//           <div style="background:#1976d2;padding:24px;text-align:center;">
//             <h1 style="color:#ffffff;margin:0;font-size:24px;">
//               Talent By Design
//             </h1>
//           </div>

//           <!-- Body -->
//           <div style="padding:32px;color:#333333;">
//             <h2 style="margin-top:0;font-size:20px;">
//               Reset your password
//             </h2>

//             <p style="font-size:15px;line-height:1.6;">
//               We received a request to reset the password for your
//               <strong>Talent By Design</strong> account.
//             </p>

//             <p style="font-size:15px;line-height:1.6;">
//               Click the button below to set a new password. If you did not
//               request a password reset, you can safely ignore this email.
//             </p>

//             <!-- CTA Button -->
//             <div style="text-align:center;margin:32px 0;">
//               <a href="${link}"
//                  style="
//                    display:inline-block;
//                    padding:14px 32px;
//                    background:#1976d2;
//                    color:#ffffff;
//                    text-decoration:none;
//                    border-radius:6px;
//                    font-size:15px;
//                    font-weight:bold;
//                  ">
//                 Reset Password
//               </a>
//             </div>

//             <p style="font-size:14px;color:#555555;">
//               This password reset link will expire in <strong>15 minutes</strong>.
//               If it expires, you can request a new one from the login page.
//             </p>

//             <p style="font-size:14px;margin-top:32px;">
//               <strong>The Talent By Design Team</strong>
//             </p>
//           </div>

//           <!-- Footer -->
//           <div style="background:#f0f2f5;padding:16px;text-align:center;font-size:12px;color:#777;">
//             <p style="margin:0;">
//               If you didn’t request a password reset, no further action is required.
//             </p>
//           </div>

//         </div>
//       </div>
//     `
//   });
// };



import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail address
    pass: process.env.EMAIL_APP_PASSWORD, // Your Gmail app password
  }
});

// Helper function to send emails and handle errors
const sendEmail = async (mailOptions) => {
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email.');
  }
};

// Function to send invitation email
// Function to send invitation email with dynamic content based on role
export const sendInvitationEmail = async (email, link, role) => {
  if (!email || !link) {
    console.error("Error: Missing email or invitation link.");
    return;
  }

  const isEmployee = role === 'employee';

  // Custom text based on role
  const title = isEmployee ? "Your Assessment Invitation" : "You are invited to join Talent By Design";
  const bodyText = isEmployee
    ? "You have been invited to complete an assessment on the Talent By Design platform. Click the button below to get started."
    : "You have been invited to join the Talent By Design platform as an administrative member. Please click the button below to complete your registration.";
  const buttonText = isEmployee ? "Start Assessment" : "Complete Registration";

  const mailOptions = {
    from: `"Talent By Design" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: title,
    html: `
      <div style="background:#f4f6f8;padding:40px 0;font-family:Arial,Helvetica,sans-serif;">
        <div style="max-width:600px;margin:0 auto;background:#ffffff; border-radius:8px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
          <div style="background:#1976d2;padding:24px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:24px;">Talent By Design</h1>
          </div>
          <div style="padding:32px;color:#333333;">
            <h2 style="margin-top:0;font-size:20px;">${title} 🚀</h2>
            <p style="font-size:15px;line-height:1.6;">${bodyText}</p>
            <div style="text-align:center;margin:32px 0;">
              <a href="${link}"
                 style="display:inline-block;padding:14px 32px;background:#1976d2;color:#ffffff;text-decoration:none;border-radius:6px;font-size:15px;font-weight:bold;">
                ${buttonText}
              </a>
            </div>
            <p style="font-size:14px;color:#555555;">
              This link will expire in <strong>1 hour</strong>.
            </p>
            <p style="font-size:14px;margin-top:32px;">
              Best regards,<br />
              <strong>The Talent By Design Team</strong>
            </p>
          </div>
        </div>
      </div>
    `
  };

  await sendEmail(mailOptions);
};

// Function to send verification email
export const sendVerificationEmail = async (user, link) => {
  if (!user?.email || !link) {
    console.error("Error: Missing email or verification link.");
    return;
  }

  console.log("Sending verification email to:", user.email);

  const mailOptions = {
    from: `"Talent By Design" <${process.env.EMAIL_USER}>`,
    to: user.email, // Ensure 'email' is valid and not undefined or empty
    subject: "Verify your email to get started with Talent By Design",
    html: `
      <div style="background:#f4f6f8;padding:40px 0;font-family:Arial,Helvetica,sans-serif;">
        <div style="max-width:600px;margin:0 auto;background:#ffffff;
                    border-radius:8px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
          <div style="background:#1976d2;padding:24px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:24px;">
              Talent By Design
            </h1>
          </div>
          <div style="padding:32px;color:#333333;">
            <h2 style="margin-top:0;font-size:20px;">
              Welcome 👋
            </h2>
            <p style="font-size:15px;line-height:1.6;">
              Thanks for joining <strong>Talent By Design</strong>.
              To complete your registration and access your profile,
              please verify your email address.
            </p>
            <div style="text-align:center;margin:32px 0;">
              <a href="${link}"
                 style="display:inline-block;padding:14px 32px;background:#1976d2;color:#ffffff;text-decoration:none;border-radius:6px;font-size:15px;font-weight:bold;">
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
          <div style="background:#f0f2f5;padding:16px;text-align:center;font-size:12px;color:#777;">
            <p style="margin:0;">
              If you didn’t create an account with Talent By Design,
              you can safely ignore this email.
            </p>
          </div>
        </div>
      </div>
    `
  };

  await sendEmail(mailOptions);
};

// Function to send password reset email
export const sendResetEmail = async (to, link) => {
  if (!to || !link) {
    console.error("Error: Missing recipient email or reset link.");
    return;
  }

  console.log("Sending reset password email to:", to);

  const mailOptions = {
    from: `"Talent By Design" <${process.env.EMAIL_USER}>`,
    to, // Ensure 'to' is valid and not undefined or empty
    subject: "Reset your Talent By Design password",
    html: `
      <div style="background:#f4f6f8;padding:40px 0;font-family:Arial,Helvetica,sans-serif;">
        <div style="max-width:600px;margin:0 auto;background:#ffffff;
                    border-radius:8px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
          <div style="background:#1976d2;padding:24px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:24px;">
              Talent By Design
            </h1>
          </div>
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
            <div style="text-align:center;margin:32px 0;">
              <a href="${link}"
                 style="display:inline-block;padding:14px 32px;background:#1976d2;color:#ffffff;text-decoration:none;border-radius:6px;font-size:15px;font-weight:bold;">
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
          <div style="background:#f0f2f5;padding:16px;text-align:center;font-size:12px;color:#777;">
            <p style="margin:0;">
              If you didn’t request a password reset, no further action is required.
            </p>
          </div>
        </div>
      </div>
    `
  };

  await sendEmail(mailOptions);
};

export const sendNotificationEmail = async (user, title, message) => {
  if (!user?.email) return;

  const mailOptions = {
    from: `"Talent By Design" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: title,
    html: `
      <div style="background:#f4f6f8;padding:40px 0;font-family:Arial,Helvetica,sans-serif;">
        <div style="max-width:600px;margin:0 auto;background:#ffffff;
                    border-radius:8px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
          <div style="background:#1976d2;padding:24px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:24px;">Talent By Design</h1>
          </div>
          <div style="padding:32px;color:#333333;">
            <h2 style="margin-top:0;font-size:20px;">${title}</h2>
            <p style="font-size:15px;line-height:1.6;">${message}</p>
             <p style="font-size:14px;color:#555555;margin-top:20px;">
              You received this email because you have enabled email notifications in your settings.
            </p>
          </div>
        </div>
      </div>
    `
  };

  try {
    await sendEmail(mailOptions);
  } catch (error) {
    console.error("Failed to send notification email", error);
  }
};
