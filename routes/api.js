const express = require("express");
const router = express.Router();
const apis = require("../controllers/api.controller");

//routes
router.route("/coordinate").post(apis.api);
router.route("/trips").get(apis.trips);
router.route("/directions").post(apis.directions);
router.route("/owner").post(apis.owner);
router.route("/map/:tripId").get(apis.trip);
router.route("/trip/:tripId").get(apis.singleTrip);
module.exports = router;
