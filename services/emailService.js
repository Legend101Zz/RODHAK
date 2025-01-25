const nodemailer = require("nodemailer");
const crypto = require("crypto");

// Create transporter
const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.SUPPORT_EMAIL, // support@himraahi.in
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Verify transporter
transporter.verify((error, success) => {
  if (error) {
    console.error("Error setting up email:", error);
  } else {
    console.log("Email service is ready to send messages");
  }
});

const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

const sendVerificationEmail = async (owner, verificationToken) => {
  const verificationUrl = `${process.env.BASE_URL}/api/v1/owner/verify-email/${verificationToken}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f4f4f4;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(to right, #c6426e, #642b73);
          color: white;
          text-align: center;
          padding: 20px;
          border-radius: 8px 8px 0 0;
        }
        .content {
          background-color: #ffffff;
          padding: 30px;
          border-radius: 0 0 8px 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .logo {
          width: 150px;
          height: auto;
          margin-bottom: 20px;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background: linear-gradient(to right, #c6426e, #642b73);
          color: white;
          text-decoration: none;
          border-radius: 4px;
          font-weight: bold;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          padding: 20px;
          color: #666;
          font-size: 0.9em;
        }
        .credentials {
          background-color: #f8f9fa;
          padding: 15px;
          border-radius: 4px;
          margin: 15px 0;
        }
        .important {
          background-color: #fff3cd;
          border: 1px solid #ffeeba;
          padding: 15px;
          border-radius: 4px;
          margin: 15px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="https://www.live.himraahi.in/static/media/rd.b58b48b62a94a351f327.png" alt="RODHAK Logo" class="logo">
          <h1>Welcome to RODHAK</h1>
        </div>

        <div class="content">
          <h2>Hello ${owner.username},</h2>
          <p>Thank you for registering with RODHAK. We're excited to have you join our platform!</p>

          <div class="credentials">
            <h3>Your Business Details:</h3>
            <p><strong>Business Name:</strong> ${owner.business}</p>
            <p><strong>Email:</strong> ${owner.email}</p>
            <p><strong>Phone:</strong> ${owner.phone}</p>
          </div>

          <div class="important">
            <h3>Important!</h3>
            <p>Please verify your email address to activate your account and start using RODHAK services.</p>
          </div>

          <div style="text-align: center;">
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
          </div>

          <p style="font-size: 0.9em; color: #666;">
            If the button above doesn't work, copy and paste this link in your browser:<br>
            <a href="${verificationUrl}">${verificationUrl}</a>
          </p>

          <p style="font-size: 0.9em; color: #666;">
            This verification link will expire in 24 hours for security reasons.
          </p>
        </div>

        <div class="footer">
          <p>© ${new Date().getFullYear()} RODHAK. All rights reserved.</p>
          <p>
            Need help? Contact us at
            <a href="mailto:support@himraahi.in">support@himraahi.in</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
    Welcome to RODHAK!

    Hello ${owner.username},

    Thank you for registering with RODHAK. Please verify your email address to activate your account.

    Your Business Details:
    - Business Name: ${owner.business}
    - Email: ${owner.email}
    - Phone: ${owner.phone}

    Please verify your email by clicking this link:
    ${verificationUrl}

    This verification link will expire in 24 hours.

    If you need any assistance, please contact us at support@himraahi.in

    Best regards,
    The RODHAK Team
  `;

  const mailOptions = {
    from: '"RODHAK Team" <support@himraahi.in>',
    to: owner.email,
    subject: "Welcome to RODHAK - Please Verify Your Email",
    html: htmlContent,
    text: textContent,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending verification email:", error);
    return false;
  }
};

const sendPasswordResetEmail = async (owner, resetToken) => {
  const resetUrl = `${process.env.BASE_URL}/reset-password/${resetToken}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(to right, #c6426e, #642b73);
          color: white;
          text-align: center;
          padding: 20px;
          border-radius: 8px 8px 0 0;
        }
        .content {
          background-color: #ffffff;
          padding: 30px;
          border-radius: 0 0 8px 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .logo {
          width: 150px;
          height: auto;
          margin-bottom: 20px;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background: linear-gradient(to right, #c6426e, #642b73);
          color: white;
          text-decoration: none;
          border-radius: 4px;
          font-weight: bold;
          margin: 20px 0;
        }
        .warning {
          background-color: #fff3cd;
          border: 1px solid #ffeeba;
          padding: 15px;
          border-radius: 4px;
          margin: 15px 0;
          font-size: 0.9em;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="https://www.live.himraahi.in/static/media/rd.b58b48b62a94a351f327.png" alt="RODHAK Logo" class="logo">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <h2>Hello ${owner.username},</h2>
          <p>We received a request to reset your password for your RODHAK account.</p>

          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </div>

          <div class="warning">
            <p><strong>⚠️ Important:</strong></p>
            <ul>
              <li>This link is valid for 1 hour only</li>
              <li>If you didn't request this password reset, please ignore this email</li>
              <li>Your password will remain unchanged if you don't use this link</li>
            </ul>
          </div>

          <p>For security reasons, this password reset link can only be used once.</p>

          <p style="color: #666; font-size: 0.9em;">
            If the button above doesn't work, copy and paste this link in your browser:<br>
            ${resetUrl}
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
    Password Reset Request - RODHAK

    Hello ${owner.username},

    We received a request to reset your password for your RODHAK account.

    To reset your password, please visit this link:
    ${resetUrl}

    Important:
    - This link is valid for 1 hour only
    - If you didn't request this password reset, please ignore this email
    - Your password will remain unchanged if you don't use this link

    For security reasons, this password reset link can only be used once.

    Best regards,
    The RODHAK Team
  `;

  const mailOptions = {
    from: '"RODHAK Security" <support@himraahi.in>',
    to: owner.email,
    subject: "Password Reset Request - RODHAK",
    html: htmlContent,
    text: textContent,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending password reset email:", error);
    return false;
  }
};

const generatePasswordResetToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

module.exports = {
  generateVerificationToken,
  sendVerificationEmail,
  generatePasswordResetToken,
  sendPasswordResetEmail,
};
