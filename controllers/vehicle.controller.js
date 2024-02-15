const Owner = require("../models/owner.schema");
const Vehicle = require("../models/vehicle.schema");

//vehicle-registration post request

module.exports.register = async (req, res, next) => {
  try {
    // Parse the owner ID from the request body
    const ownerId = JSON.parse(req.body.id);

    // Create a lowercase, non-alphanumeric version of the vehicleNum
    const numLower = req.body.vehicleNum.toLowerCase();
    const num = numLower.replace(/\W/g, "");

    // Create a new Vehicle instance
    const vehicle = new Vehicle({
      name: req.body.name,
      vehicleNum: num,
      Type: req.body.type, // Assuming "type" is included in the request body
      Owner: ownerId,
    });

    // Save the vehicle to the database
    const savedVehicle = await vehicle.save();

    // Update the Owner's Vehicle array with the new vehicle ID
    await Owner.findByIdAndUpdate(
      { _id: ownerId },
      { $push: { Vehicle: savedVehicle._id } }
    );

    res.status(200).send({
      message: "Success! Vehicle registration complete",
      data: savedVehicle,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      message: "Error",
      error: error.message,
    });
  }
};

module.exports.getVehicles = async (req, res) => {
  try {
    const ownerId = req.params.ownerId;

    // Find the owner
    const owner = await Owner.findById(ownerId);
    if (!owner) {
      return res.status(404).json({ message: "Owner not found" });
    }

    // Find the vehicles for the owner
    const vehicles = await Vehicle.find({ Owner: ownerId });

    // Separate vehicles into verified and unverified
    const verifiedVehicles = vehicles.filter(
      (vehicle) => vehicle.isVerified === "true"
    );
    const unverifiedVehicles = vehicles.filter(
      (vehicle) => vehicle.isVerified === "false"
    );

    // Extract name and vehicleNum from each vehicle
    const verifiedVehicleInfo = verifiedVehicles.map((vehicle) => ({
      name: vehicle.name,
      vehicleNum: vehicle.vehicleNum,
    }));

    const unverifiedVehicleInfo = unverifiedVehicles.map((vehicle) => ({
      name: vehicle.name,
      vehicleNum: vehicle.vehicleNum,
    }));

    res.status(200).json({
      verifiedVehicles: verifiedVehicleInfo,
      unverifiedVehicles: unverifiedVehicleInfo,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error", error: error.message });
  }
};
