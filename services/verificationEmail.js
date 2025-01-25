const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.SUPPORT_EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendVerificationEmail = async (type, userData) => {
  let subject, htmlContent;

  switch (type) {
    case "owner":
      subject = "RODHAK - Account Verified Successfully!";
      htmlContent = `
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
            .button {
              display: inline-block;
              padding: 12px 24px;
              background: linear-gradient(to right, #c6426e, #642b73);
              color: white !important;
              text-decoration: none;
              border-radius: 4px;
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
              <h1>Account Verified!</h1>
            </div>
            <div class="content">
              <h2>Congratulations, ${userData.username}!</h2>
              <p>Great news! Your RODHAK business account has been verified by our admin team. You can now access all features of the platform.</p>

              <h3>Your Business Details:</h3>
              <ul>
                <li>Business Name: ${userData.business}</li>
                <li>Email: ${userData.email}</li>
                <li>Phone: ${userData.phone}</li>
              </ul>

              <div style="text-align: center;">
                <a href="https://owner-dnd-rodhak.onrender.com/" class="button">Login to Dashboard</a>
              </div>

              <p>What's Next?</p>
              <ul>
                <li>Add your vehicles to the platform</li>
                <li>Register your drivers</li>
                <li>Start managing your transportation business efficiently</li>
              </ul>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} RODHAK. All rights reserved.</p>
              <p>Need help? Contact us at <a href="mailto:support@himraahi.in">support@himraahi.in</a></p>
            </div>
          </div>
        </body>
        </html>
      `;
      break;

    case "driver":
      subject = "RODHAK - Driver Account Verified Successfully!";
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            /* Same styles as above */
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="https://himraahi.in/logo.png" alt="RODHAK Logo" style="width: 150px;">
              <h1>Driver Account Verified!</h1>
            </div>
            <div class="content">
              <h2>Welcome aboard, ${userData.username}!</h2>
              <p>Your driver account has been verified by the RODHAK admin team. You can now start using the platform for your trips.</p>

              <h3>Your Account Details:</h3>
              <ul>
                <li>Name: ${userData.username}</li>
                <li>Email: ${userData.email}</li>
                <li>Phone: ${userData.phone}</li>
              </ul>

              <div style="text-align: center;">
                <a href="${process.env.BASE_URL}/api/v1/driver/login" class="button">Login Now</a>
              </div>

              <p>What's Next?</p>
              <ul>
                <li>Log in to your account</li>
                <li>Start your first trip</li>
                <li>Track your journey with RODHAK</li>
              </ul>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} RODHAK. All rights reserved.</p>
              <p>Need help? Contact us at <a href="mailto:support@himraahi.in">support@himraahi.in</a></p>
            </div>
          </div>
        </body>
        </html>
      `;
      break;

    case "vehicle":
      subject = "RODHAK - Vehicle Verified Successfully!";
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            /* Same styles as above */
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="https://himraahi.in/logo.png" alt="RODHAK Logo" style="width: 150px;">
              <h1>Vehicle Verified!</h1>
            </div>
            <div class="content">
              <h2>Vehicle Registration Complete!</h2>
              <p>Your vehicle has been verified and is now ready for service on the RODHAK platform.</p>

              <h3>Vehicle Details:</h3>
              <ul>
                <li>Vehicle Number: ${userData.vehicleNum}</li>
                <li>Type: ${userData.Type}</li>
                <li>Name: ${userData.name}</li>
              </ul>

              <p>What's Next?</p>
              <ul>
                <li>Assign drivers to this vehicle</li>
                <li>Start tracking trips</li>
                <li>Monitor vehicle performance</li>
              </ul>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} RODHAK. All rights reserved.</p>
              <p>Need help? Contact us at <a href="mailto:support@himraahi.in">support@himraahi.in</a></p>
            </div>
          </div>
        </body>
        </html>
      `;
      break;
  }

  const mailOptions = {
    from: '"RODHAK Team" <support@himraahi.in>',
    to: userData.email,
    subject,
    html: htmlContent,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending verification email:", error);
    return false;
  }
};

module.exports = {
  sendVerificationEmail,
};
