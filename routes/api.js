const express = require("express");
const router = express.Router();
const apis = require("../controllers/api.controller");
const auth = require("../middleware/auth");

// Public routes (no auth required)
router.post("/owner", apis.owner); // login
router.post("/request-reset", apis.requestPasswordReset);
router.post("/reset-password", apis.resetPassword);

//map routes
router.get("/trips", apis.trips);
router.get("/map/:tripId", apis.trip);
router.get("/trip/:tripId", apis.singleTrip);
router.get("/trip/Coords/:id", apis.getTripCoordsData);

// Protected routes (auth required)
router.post("/change-password", auth, apis.changePassword);
router.get("/owner/:id", auth, apis.ownerData);
router.get("/driver/:id", auth, apis.getDriverDetails);
router.get("/attendance/:ownerId", auth, apis.getOwnerDriversAttendance);

// If you still need these legacy routes
router.post("/coordinate", apis.api);
router.post("/directions/:id", apis.directions);

module.exports = router;
