const express = require("express");
const router = express.Router();
const vehicle = require("../controllers/vehicle.controller");

//vehicle-registration

router.route("/register").post(vehicle.register);

router.route("/owner/:ownerId").get(vehicle.getVehicles);

router.route("/trips/:id").get(vehicle.getVehicleTrips);

router.route("/vehicle/:id").get(vehicle.getVehicleDetails);

// Delete vehicle
router.delete("/delete/:ownerId/:vehicleId", vehicle.deleteVehicle);

module.exports = router;
