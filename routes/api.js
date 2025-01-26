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
router.use(auth); // Apply auth middleware to all routes below this line

router.post("/change-password", apis.changePassword);
router.get("/owner/:id", apis.ownerData);
router.get("/attendance/:ownerId", apis.getOwnerDriversAttendance);

// If you still need these legacy routes
router.post("/coordinate", apis.api);
router.post("/directions/:id", apis.directions);

module.exports = router;
