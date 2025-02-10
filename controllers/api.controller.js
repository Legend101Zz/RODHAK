const Owner = require("../models/owner.schema");
const Driver = require("../models/driver.schema");
const Admin = require("../models/admin.schema");
const Vehicle = require("../models/vehicle.schema");
const Trip = require("../models/trip.schema");
const Attendance = require("../models/attendance.schema");
const {
  generatePasswordResetToken,
  sendPasswordResetEmail,
} = require("../services/emailService");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
var mongoose = require("mongoose");

// -----------NOT IN USE NOW AS WE USE WEBSOCKETS TO HANDLE THIS--------------
//===============LEGACY CODE===============
// api for updating current coordinates
module.exports.api = async (req, res, next) => {
  // console.log(req.session.tripId);
  const id = req.body.data.tripId;
  const longitude = req.body.data.long;
  const latitude = req.body.data.lat;
  const speed = req.body.data.speed;
  const coordinates = [longitude, latitude];
  // console.log("coords__API__STARTED=--->", id, coordinates);
  await Trip.findOneAndUpdate(
    { _id: id },
    { currentCoordinates: coordinates, Speed: speed }
  );
};
//owner login
module.exports.owner = async (req, res) => {
  try {
    // Validate request body
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide both email and password",
      });
    }

    // Find owner excluding sensitive data
    const owner = await Owner.findOne(
      { email },
      { password: 1, email: 1, username: 1, business: 1, isVerified: 1 }
    );

    // Check if owner exists
    if (!owner) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, owner.password);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check if owner is verified
    if (owner.isVerified !== "true") {
      return res.status(403).json({
        success: false,
        message: "Account is pending verification",
      });
    }

    // Generate JWT token
    const token = owner.generateAuthToken();

    // Remove password from response data
    const ownerData = owner.toObject();
    delete ownerData.password;

    // Set token in cookie with HTTP-only flag
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    // Send success response
    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        owner: ownerData,
        token,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

//all trips api
module.exports.trips = async (req, res, next) => {
  const trips = await Trip.find(
    {
      isFinished: false,
      isPublic: true,
    },
    {
      Driver: 0,
      coordinateStart: 0,
      coordinateEnd: 0,

      isFinished: 0,
      isPublic: 0,
    }
  );
  console.log(trips, "hello1");
  res.status(200).send({ message: "Success", data: trips });
};

//api for giving current coordinates

//getting singleTrip data for map
module.exports.trip = async (req, res, next) => {
  const trip = await Trip.findById(req.params.tripId);
  const vehicle = await Vehicle.find({ Trip: trip._id });
  // console.log("Vehicle--->", vehicle[0].vehicleNum);
  if (trip) {
    res.status(200).send({
      message: "Success",
      data: {
        currentCoordinates: trip.currentCoordinates,
        Start: trip.coordinateStart,
        End: trip.coordinateEnd,
        Vehicle: vehicle[0].vehicleNum,
      },
    });
  } else {
    res.status(401).send({ message: "Invalid Trip id" });
  }
};

// get start and end coords of a single trip

module.exports.getTripCoordsData = async (req, res) => {
  const tripId = req.params.id;

  try {
    // Find the trip by ID
    const trip = await Trip.findById(tripId);

    if (!trip) {
      return res.status(404).json({ error: "Trip not found" });
    }

    // Extract start and end coordinates
    const { coordinateStart, coordinateEnd, via, Start, End, viaRoute } = trip;
    console.log("testing coords", coordinateStart, coordinateEnd, via);
    res.json({
      Start,
      End,
      viaRoute,
      coordinateStart,
      coordinateEnd,
      via,
    });
  } catch (error) {
    console.error("Error fetching trip coordinates:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

//map-rendering
module.exports.singleTrip = async (req, res, next) => {
  // console.log(req.params.tripId);
  try {
    const check = req.params.tripId;
    // console.log(mongoose.Types.ObjectId.isValid(req.params.tripId));
    // console.log(mongoose.Types.ObjectId.isValid("643cacfc4d0fdb5ff3e79343"));
    // const id = toString(check);
    // console.log(check, id);
    const trip = await Trip.findById(check);
    // console.log("TRIP__HERE", trip.isFinished);
    if (trip) {
      if (!trip.isFinished) {
        res.render("map", { env: process.env.MAP_BOX });
      } else {
        res.render("tripFinish");
      }
    } else {
      res.status(401).send({ message: "Invalid Trip id" });
    }
  } catch (err) {
    console.log(err);
  }
};

//send individual owner data no vehicles and rest

module.exports.ownerData = async (req, res, next) => {
  console.log("checl");

  const id = req.params.id;
  const owner = await Owner.findById(id);
  // console.log(owner);
  if (owner) {
    res.status(200).send({ message: "success", data: owner });
  } else {
    res.status(401).send({ message: "Invalid Owner id" });
  }
};

//depreciated apis

module.exports.directions = async (req, res, next) => {
  const trip = await Trip.findById(req.params.id);
  if (trip) {
    res.status(200).send({ message: "Success", data: trip });
  } else {
    res.status(401).send({ message: "Invalid Trip id" });
  }
};

// Request password reset
module.exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const owner = await Owner.findOne({ email });

    if (!owner) {
      return res.status(200).send({
        message:
          "If an account exists with this email, you'll receive a reset link",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour

    // Update owner with reset token
    owner.resetPasswordToken = resetToken;
    owner.resetPasswordExpires = resetTokenExpiry;
    await owner.save();

    // Send reset email
    const transporter = nodemailer.createTransport({
      host: "smtp.hostinger.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.SUPPORT_EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: '"RODHAK Support" <support@himraahi.in>',
      to: owner.email,
      subject: "Password Reset Request - RODHAK",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(to right, #c6426e, #642b73); padding: 20px; text-align: center; color: white;">
            <img src="https://www.live.himraahi.in/static/media/rd.b58b48b62a94a351f327.png" alt="RODHAK Logo" style="width: 150px;">
            <h2>Password Reset Request</h2>
          </div>
          <div style="padding: 20px; background: white; border-radius: 0 0 8px 8px;">
            <p>Hello ${owner.username},</p>
            <p>We received a request to reset your password. Click the button below to choose a new password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/reset-password/${resetToken}"
                 style="background: linear-gradient(to right, #c6426e, #642b73);
                        color: white; padding: 12px 24px; text-decoration: none;
                        border-radius: 4px;">
                Reset Password
              </a>
            </div>
            <p style="color: #666; font-size: 0.9em;">This link will expire in 1 hour.</p>
            <p style="color: #666; font-size: 0.9em;">If you didn't request this reset, you can safely ignore this email.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).send({
      message:
        "If an account exists with this email, you'll receive a reset link",
    });
  } catch (error) {
    console.error("Password reset request error:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
};

// utility fn

// Generate password changed email template
const generatePasswordChangedEmailTemplate = (username) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(to right, #c6426e, #642b73); padding: 20px; text-align: center; color: white;">
        <img src="https://www.live.himraahi.in/static/media/rd.b58b48b62a94a351f327.png" alt="RODHAK Logo" style="width: 150px;">
        <h2>Password Changed - Security Alert</h2>
      </div>
      <div style="padding: 20px; background: white; border-radius: 0 0 8px 8px;">
        <p>Hello ${username},</p>
        <p>This email confirms that your RODHAK account password has been changed.</p>
        <div style="background: #fff3cd; border: 1px solid #ffeeba; color: #856404; padding: 15px; border-radius: 4px; margin: 20px 0;">
          <strong>⚠️ Security Notice:</strong>
          <p>If you did not make this change, please:</p>
          <ol style="margin-top: 10px;">
            <li>Change your password immediately</li>
            <li>Contact our support team at support@himraahi.in</li>
          </ol>
        </div>
        <p>For security purposes, we recommend:</p>
        <ul style="color: #666;">
          <li>Using a strong, unique password</li>
          <li>Never sharing your password with anyone</li>
          <li>Regularly reviewing your account activity</li>
        </ul>
        <p style="margin-top: 20px;">Best regards,<br>The RODHAK Security Team</p>
      </div>
      <div style="text-align: center; padding: 20px; color: #666; font-size: 0.8em;">
        <p>This is an automated message, please do not reply directly to this email.</p>
      </div>
    </div>
  `;
};

// Reset password using token
module.exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const owner = await Owner.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!owner) {
      return res.status(400).send({
        message: "Password reset token is invalid or has expired",
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(Number(10));
    const hashPassword = await bcrypt.hash(newPassword, salt);

    // Update password and clear reset token
    owner.password = hashPassword;
    owner.resetPasswordToken = undefined;
    owner.resetPasswordExpires = undefined;
    await owner.save();

    // Generate new auth token
    const authToken = owner.generateAuthToken();

    // Send password change notification email
    const transporter = nodemailer.createTransport({
      host: "smtp.hostinger.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.SUPPORT_EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: '"RODHAK Support" <support@himraahi.in>',
      to: owner.email,
      subject: "Password Changed - Security Alert - RODHAK",
      html: generatePasswordChangedEmailTemplate(owner.username),
    };

    await transporter.sendMail(mailOptions);

    res.status(200).send({
      message: "Password reset successful",
      data: owner,
      token: authToken,
    });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
};

// Change password (when logged in)
module.exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const owner = await Owner.findById(req.owner._id);

    if (!owner) {
      return res.status(404).send({ message: "Owner not found" });
    }

    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, owner.password);
    if (!validPassword) {
      return res.status(400).send({ message: "Current password is incorrect" });
    }

    // Hash and save new password
    const salt = await bcrypt.genSalt(Number(10));
    const hashPassword = await bcrypt.hash(newPassword, salt);
    owner.password = hashPassword;
    await owner.save();

    res.status(200).send({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
};

// Owner's drivers Attendance
//
module.exports.getOwnerDriversAttendance = async (req, res) => {
  try {
    const ownerId = req.params.ownerId;

    // Find owner and populate drivers
    const owner = await Owner.findById(ownerId).populate({
      path: "Driver",
      select: "_id username",
    });

    if (!owner) {
      return res.status(404).json({
        success: false,
        message: "Owner not found",
      });
    }

    // Get all driver IDs under this owner
    const driverIds = owner.Driver.map((driver) => driver._id);

    // Get attendance records for all these drivers
    const attendance = await Attendance.find({
      driver: { $in: driverIds },
    })
      .populate({
        path: "driver",
        select: "username email",
      })
      .populate({
        path: "trips",
        select: "Start End start_time end_time Vehicle",
      })
      .sort({ date: -1 });

    // Calculate some useful statistics
    const stats = attendance.reduce((acc, record) => {
      const driverId = record.driver._id.toString();
      if (!acc[driverId]) {
        acc[driverId] = {
          driverName: record.driver.username,
          totalHours: 0,
          daysWorked: 0,
          averageHoursPerDay: 0,
          trips: 0,
        };
      }

      acc[driverId].totalHours += record.totalHours;
      acc[driverId].daysWorked += 1;
      acc[driverId].trips += record.trips.length;
      acc[driverId].averageHoursPerDay =
        acc[driverId].totalHours / acc[driverId].daysWorked;

      return acc;
    }, {});

    return res.status(200).json({
      success: true,
      data: {
        attendance,
        stats,
        totalDrivers: driverIds.length,
        totalRecords: attendance.length,
      },
    });
  } catch (error) {
    console.error("Get owner drivers attendance error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching attendance records",
      error: error.message,
    });
  }
};
