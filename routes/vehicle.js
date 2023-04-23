const express = require("express");
const router = express.Router();
const vehicle = require("../controllers/vehicle.controller");

//vehicle-registration

router.route("/register").post(vehicle.register);

module.exports = router;
