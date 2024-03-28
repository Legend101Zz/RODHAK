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

router.route("/start").get(drivers.start).post(drivers.trip);
router.route("/map/:id").post(drivers.map);
router.route("/end").get(drivers.end);

//test routes
router.route("/test").get((req, res) => {
  res.status(200).send({ message: "success" });
});

//api routes
router.route("/login/api").post(drivers.loginVerifyApi);
router.route("/getActiveTrips/:driverId").get(drivers.getActiveTrips);
router.route("/endTrip/api").post(drivers.endTripApi);
router.route("/createTrip/api").post(drivers.createTripApi);
router.route("/registerAPI").post(
  upload.fields([
    { name: "image", maxCount: 2 },
    { name: "legal", maxCount: 8 },
  ]),
  drivers.DriverRegisterAPI
);

module.exports = router;
