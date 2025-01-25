const Owner = require("../models/owner.schema");
const Trip = require("../models/trip.schema");
const bcrypt = require("bcrypt");
const {
  generateVerificationToken,
  sendVerificationEmail,
} = require("../services/emailService");

// creating mail service
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_MAIL,
    pass: process.env.GMAIL_PASSWORD,
  },
  port: 465,
  host: "smtp.gmail.com",
});

transporter.verify((error, success) => {
  if (error) {
    console.log(error);
  } else {
    console.log("Lets go babbyy");
  }
});

//render registeration form \

module.exports.renderRegister = (req, res) => {
  res.render("users/register");
};

// Handle registration
module.exports.register = async (req, res, next) => {
  try {
    const user = await Owner.findOne({ email: req.body.email });
    if (user) {
      return res.status(409).send({
        message: "Owner with the given email already exists",
      });
    }

    const { email, username, password, phone, business } = req.body;
    const obj = Object.assign({}, req.files);

    // Process image files
    const imagesObj = obj.image;
    const legalObj = obj.legal;
    const imagesUrl = imagesObj[0].path;
    const imagesPath = imagesObj[0].filename;
    const legalUrl = legalObj[0].path;
    const legalPath = legalObj[0].filename;
    const imagesArr = [{ url: imagesUrl, filename: imagesPath }];
    const legalArr = [{ url: legalUrl, filename: legalPath }];

    // Generate verification token
    const verificationToken = generateVerificationToken();
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 24); // Token expires in 24 hours

    // Hash password
    const salt = await bcrypt.genSalt(Number(10));
    const hashPassword = await bcrypt.hash(password, salt);

    // Create new owner
    const owner = new Owner({
      email,
      username,
      phone,
      business,
      password: hashPassword,
      emailVerificationToken: verificationToken,
      emailVerificationTokenExpires: tokenExpiry,
      emailVerified: false,
      isVerified: "false",
      images: imagesArr,
      legal: legalArr,
    });

    // Save owner to database
    await owner.save();

    // Send verification email
    const emailSent = await sendVerificationEmail(owner, verificationToken);

    if (!emailSent) {
      return res.status(500).json({
        type: "failure",
        message: "Failed to send verification email",
      });
    }

    // Render verification pending page
    res.render("users/verify-email", { email: owner.email });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      type: "failure",
      message: "Server error during registration",
    });
  }
};

// Handle email verification
module.exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const owner = await Owner.findOne({
      emailVerificationToken: token,
      emailVerificationTokenExpires: { $gt: Date.now() },
      emailVerified: false,
    });

    if (!owner) {
      return res.render("users/verification-error", {
        message:
          "Invalid or expired verification link. Please register again or request a new verification link.",
      });
    }

    // Update owner verification status
    owner.emailVerified = true;
    owner.emailVerificationToken = undefined;
    owner.emailVerificationTokenExpires = undefined;
    await owner.save();

    res.render("users/verification-success");
  } catch (error) {
    console.error("Verification error:", error);
    res.render("users/verification-error", {
      message: "Server error during verification. Please try again later.",
    });
  }
};

// Resend verification email
module.exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    const owner = await Owner.findOne({ email, emailVerified: false });

    if (!owner) {
      return res.status(404).json({
        message: "No pending verification found for this email",
      });
    }

    // Generate new verification token
    const verificationToken = generateVerificationToken();
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 24);

    // Update owner with new token
    owner.emailVerificationToken = verificationToken;
    owner.emailVerificationTokenExpires = tokenExpiry;
    await owner.save();

    // Send new verification email
    const emailSent = await sendVerificationEmail(owner, verificationToken);

    if (!emailSent) {
      return res.status(500).json({
        message: "Failed to send verification email",
      });
    }

    res.json({
      message: "Verification email sent successfully",
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    res.status(500).json({
      message: "Server error while resending verification email",
    });
  }
};

//login

module.exports.login = async (req, res, next) => {
  try {
    const owner = await Owner.findOne({ email: req.body.email });
    if (!owner) {
      return res.status(401).send({ message: "Invalid email or password" });
    }
    const validPassword = await bcrypt.compare(
      req.body.password,
      owner.password,
    );
    if (!validPassword) {
      return res.status(401).send({ message: "Invalid password or Password" });
    }
    const token = owner.generateAuthToken();
    res.status(200).send({ data: token, message: "Logged In successfully" });
  } catch (error) {
    res.status(500).send({ message: "Internal Server Error" });
  }
};

//mail testing

module.exports.test = (req, res) => {
  console.log("hit");
  const mailOptions = {
    from: process.env.GMAIL_MAIL,
    to: "21bma010@nith.ac.in",
    subject: "Welcome to Rodhak.",
    html: `
Dear  your password is :-. Please use this to login again.`,
  };

  transporter
    .sendMail(mailOptions)
    .then(() => {
      //email sent and verification saved

      res.status(201).json({
        type: "success",
        message: "mail sent",
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(201).json({
        type: "failure",
        message: "denial email not sent",
      });
    });
};

module.exports.getDriverDetails = async (req, res) => {
  try {
    const ownerId = req.params.ownerId;

    // Find the owner by ID
    const owner = await Owner.findById(ownerId);

    if (!owner) {
      return res.status(404).json({ message: "Owner not found" });
    }
    console.log(owner);
    // Extract driver details from the owner
    const drivers = owner.Driver.map((driver) => ({
      id: driver._id,
      name: driver.username,
      email: driver.email,
      age: driver.age,
      phone: driver.phone,
      trips: driver.Trip.length > 0 ? driver.Trip.length : 0,
    }));

    res.json({ drivers });
  } catch (error) {
    console.error("Error getting owner drivers:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports.removeDriver = async (req, res) => {
  try {
    const { ownerId, driverId } = req.params;

    // Find the owner and driver
    const owner = await Owner.findById(ownerId);
    const driver = await Driver.findById(driverId);

    if (!owner || !driver) {
      return res.status(404).json({
        success: false,
        message: "Owner or Driver not found",
      });
    }

    // Verify that this driver belongs to this owner
    if (!owner.Driver.includes(driverId)) {
      return res.status(403).json({
        success: false,
        message: "This driver does not belong to this owner",
      });
    }

    // Remove driver from owner's Driver array
    await Owner.findByIdAndUpdate(
      ownerId,
      { $pull: { Driver: driverId } },
      { new: true },
    );

    // Clear the Owner reference in driver document
    await Driver.findByIdAndUpdate(
      driverId,
      { $unset: { Owner: "" } },
      { new: true },
    );

    res.status(200).json({
      success: true,
      message: "Driver removed successfully from owner's organization",
    });
  } catch (error) {
    console.error("Error removing driver:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports.getOwnerVehicles = async (req, res) => {
  try {
    const ownerId = req.params.ownerId;
    const owner = await Owner.findById(ownerId).populate("Vehicle");

    if (!owner) {
      return res.status(404).json({ message: "Owner not found" });
    }

    // Prepare response object
    const vehicles = [];

    // Iterate over owner's vehicles
    for (const vehicle of owner.Vehicle) {
      // Check if the vehicle is in any trip
      const trip = await Trip.findOne({
        Vehicle: vehicle.vehicleNum,
        isFinished: false,
      });

      // Determine vehicle status
      const status = trip ? "active" : "not active";

      // Add vehicle to response object
      vehicles.push({
        vehicleNum: vehicle.vehicleNum,
        status: status,
      });
    }

    res.status(200).json({
      ownerId: owner._id,
      vehicles: vehicles,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
