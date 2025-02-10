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

const sendDriverRegistrationEmails = async (driverData, ownerData) => {
  // Email to Driver
  const driverMailOptions = {
    from: '"RODHAK Team" <support@himraahi.in>',
    to: driverData.email,
    subject: "RODHAK - Driver Registration Initiated",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(to right, #c6426e, #642b73);
            color: white;
            text-align: center;
            padding: 30px 20px;
            border-radius: 8px 8px 0 0;
          }
          .content {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 0 0 8px 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            color: #666;
            font-size: 0.9em;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://www.live.himraahi.in/static/media/rd.b58b48b62a94a351f327.png" alt="RODHAK Logo" style="width: 150px;">
            <h1>Welcome to RODHAK!</h1>
          </div>
          <div class="content">
            <h2>Hello ${driverData.username},</h2>
            <p>Thank you for registering as a driver with RODHAK. Your registration process has been initiated successfully.</p>

            <h3>Your Registration Details:</h3>
            <ul>
              <li>Name: ${driverData.username}</li>
              <li>Email: ${driverData.email}</li>
              <li>Phone: ${driverData.phone}</li>
              <li>Business Owner: ${ownerData.business}</li>
              <li>Password: ${driverData.password}</li>
            </ul>

            <h3>Next Steps:</h3>
            <p>Our admin team will review your registration details. This typically takes 24-48 hours. Once verified, you'll receive another email with your login credentials.</p>

            <p>If you have any questions in the meantime, please contact your business owner or reach out to our support team.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} RODHAK. All rights reserved.</p>
            <p>Need help? Contact us at <a href="mailto:support@himraahi.in">support@himraahi.in</a></p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  // Email to Owner
  const ownerMailOptions = {
    from: '"RODHAK Team" <support@himraahi.in>',
    to: ownerData.email,
    subject: "RODHAK - New Driver Registration",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(to right, #c6426e, #642b73);
            color: white;
            text-align: center;
            padding: 30px 20px;
            border-radius: 8px 8px 0 0;
          }
          .content {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 0 0 8px 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            color: #666;
            font-size: 0.9em;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://www.live.himraahi.in/static/media/rd.b58b48b62a94a351f327.png" alt="RODHAK Logo" style="width: 150px;">
            <h1>New Driver Registration</h1>
          </div>
          <div class="content">
            <h2>Hello ${ownerData.username},</h2>
            <p>A new driver has been registered under your business on RODHAK.</p>

            <h3>Driver Details:</h3>
            <ul>
              <li>Name: ${driverData.username}</li>
              <li>Email: ${driverData.email}</li>
              <li>Phone: ${driverData.phone}</li>
              <li>Age: ${driverData.age}</li>
            </ul>

            <p>The driver's registration is pending verification by our admin team. You'll be notified once the verification is complete.</p>

            <p>You can view the driver's details in your dashboard once they're verified.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} RODHAK. All rights reserved.</p>
            <p>Need help? Contact us at <a href="mailto:support@himraahi.in">support@himraahi.in</a></p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await Promise.all([
      transporter.sendMail(driverMailOptions),
      transporter.sendMail(ownerMailOptions),
    ]);
    return true;
  } catch (error) {
    console.error("Error sending registration emails:", error);
    return false;
  }
};

const sendVehicleEmails = async (vehicleData, ownerData) => {
  const mailOptions = {
    from: '"RODHAK Team" <support@himraahi.in>',
    to: ownerData.email,
    subject: "RODHAK - New Vehicle Registration Initiated",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(to right, #c6426e, #642b73);
            color: white;
            text-align: center;
            padding: 30px 20px;
            border-radius: 8px 8px 0 0;
          }
          .content {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 0 0 8px 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .vehicle-info {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            color: #666;
            font-size: 0.9em;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://www.live.himraahi.in/static/media/rd.b58b48b62a94a351f327.png" alt="RODHAK Logo" style="width: 150px;">
            <h1>New Vehicle Registration</h1>
          </div>
          <div class="content">
            <h2>Hello ${ownerData.username},</h2>
            <p>A new vehicle has been registered under your business "${ownerData.business}" on RODHAK.</p>

            <div class="vehicle-info">
              <h3>Vehicle Details:</h3>
              <ul>
                <li><strong>Vehicle Name:</strong> ${vehicleData.name}</li>
                <li><strong>Vehicle Number:</strong> ${vehicleData.vehicleNum}</li>
                <li><strong>Type:</strong> ${vehicleData.Type}</li>
              </ul>
            </div>

            <h3>Next Steps:</h3>
            <ol>
              <li>Our admin team will verify the vehicle details</li>
              <li>You'll receive a confirmation email once verification is complete</li>
              <li>After verification, you can assign drivers to this vehicle</li>
              <li>Start tracking trips and managing your fleet efficiently</li>
            </ol>

            <p><strong>Note:</strong> The verification process typically takes 24-48 hours. We'll notify you once it's complete.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} RODHAK. All rights reserved.</p>
            <p>Need help? Contact us at <a href="mailto:support@himraahi.in">support@himraahi.in</a></p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending vehicle registration email:", error);
    return false;
  }
};

const generatePasswordResetToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

module.exports = {
  sendVehicleEmails,
  sendDriverRegistrationEmails,
  generateVerificationToken,
  sendVerificationEmail,
  generatePasswordResetToken,
  sendPasswordResetEmail,
};
