const express = require("express");
const router = express.Router();
const multer = require("multer");
const { storage } = require("../cloudinary/index");
const upload = multer({ storage });
const drivers = require("../controllers/driver.controller");

router
  .route("/register")
  .get(drivers.renderRegister)
  .post(
    upload.fields([
      { name: "image", maxCount: 2 },
      { name: "legal", maxCount: 8 },
    ]),
    drivers.DriverRegister
  );

module.exports = router;
