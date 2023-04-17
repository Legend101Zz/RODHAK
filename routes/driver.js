const express = require("express");
const router = express.Router();
const multer = require("multer");
const { storage } = require("../cloudinary/index");
const upload = multer({ storage });
const drivers = require("../controllers/driver.controller");

//login-register
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

router.route("/login").get(drivers.login).post(drivers.loginVerify);

//driver pages
router.route("/main").get(drivers.main);
router.route("/map/:id").get(drivers.map);
router.route("/start").get(drivers.start).post(drivers.trip);

//test routes
router.route("/test").get((req, res) => {
  res.render("driver/map");
});

module.exports = router;
