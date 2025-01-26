const express = require("express");
const router = express.Router();
const multer = require("multer");
const { storage } = require("../cloudinary/index");
const upload = multer({ storage });
const owners = require("../controllers/owner.controllers");
const auth = require("../middleware/auth");

// Registration routes
router
  .route("/register")
  .get(owners.renderRegister)
  .post(
    upload.fields([
      { name: "image", maxCount: 2 },
      { name: "legal", maxCount: 8 },
    ]),
    owners.register,
  );

// Email verification
router.get("/verify-email/:token", owners.verifyEmail);
router.post("/resend-verification", owners.resendVerification);

// apis
router.use(auth); // Apply auth middleware to all routes below this line

router.route("/getDriverDetails/:ownerId").get(owners.getDriverDetails);
router.route("/getVehicleDetails/:ownerId").get(owners.getOwnerVehicles);

// Remove driver from owner's organization
router.delete("/removeDriver/:ownerId/:driverId", owners.removeDriver);

//route for testing email service:
router.route("/test").get(owners.test);

module.exports = router;
