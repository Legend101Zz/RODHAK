const Vehicle = require("../models/vehicle.schema");
const Trip = require("../models/trip.schema");
const Owner = require("../models/owner.schema");

// Utility function to handle errors
const handleError = (err, res) => {
  console.error("Error:", err);
  return res.status(500).json({
    success: false,
    message: "An error occurred",
    error: err.message,
  });
};

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
      { $push: { Vehicle: savedVehicle._id } },
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
      (vehicle) => vehicle.isVerified === "true",
    );
    const unverifiedVehicles = vehicles.filter(
      (vehicle) => vehicle.isVerified === "false",
    );

    // Extract name and vehicleNum from each vehicle
    const verifiedVehicleInfo = verifiedVehicles.map((vehicle) => ({
      id: vehicle._id,
      name: vehicle.name,
      vehicleNum: vehicle.vehicleNum,
    }));

    const unverifiedVehicleInfo = unverifiedVehicles.map((vehicle) => ({
      id: vehicle._id,
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

// Get detailed information about a specific vehicle
module.exports.getVehicleDetails = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("ROUTE HIt");
    // Find vehicle and populate related data
    const vehicle = await Vehicle.findById(id).populate({
      path: "Trip",
      populate: {
        path: "Driver",
        select: "username email phone",
      },
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    // Get performance metrics and statistics
    const performanceMetrics = await getVehiclePerformanceMetrics(id);

    return res.status(200).json({
      success: true,
      data: {
        ...vehicle.toObject(),
        performanceMetrics,
      },
    });
  } catch (err) {
    return handleError(err, res);
  }
};

// Get all trips for a specific vehicle
module.exports.getVehicleTrips = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const trips = await Trip.find({ Vehicle: id })
      .populate("Driver", "username email phone")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Trip.countDocuments({ Vehicle: id });

    return res.status(200).json({
      success: true,
      data: trips,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    return handleError(err, res);
  }
};

// Get vehicle performance metrics
const getVehiclePerformanceMetrics = async (vehicleId) => {
  const trips = await Trip.find({ Vehicle: vehicleId, isFinished: true });

  // Calculate metrics
  const metrics = {
    totalTrips: trips.length,
    totalDistance: 0,
    averageSpeed: 0,
    fuelEfficiency: 0,
    // Add more metrics as needed
  };

  if (trips.length > 0) {
    // Calculate total distance and other metrics
    // This is just an example - implement your actual calculation logic
    metrics.totalDistance = trips.reduce(
      (acc, trip) => acc + calculateDistance(trip),
      0,
    );
    metrics.averageSpeed = calculateAverageSpeed(trips);
    metrics.fuelEfficiency = calculateFuelEfficiency(trips);
  }

  return metrics;
};

module.exports.deleteVehicle = async (req, res) => {
  try {
    const { ownerId, vehicleId } = req.params;

    // Find the owner and vehicle
    const owner = await Owner.findById(ownerId);
    const vehicle = await Vehicle.findById(vehicleId);

    if (!owner || !vehicle) {
      return res.status(404).json({
        success: false,
        message: "Owner or Vehicle not found",
      });
    }

    // Verify that this vehicle belongs to this owner
    if (!owner.Vehicle.includes(vehicleId)) {
      return res.status(403).json({
        success: false,
        message: "This vehicle does not belong to this owner",
      });
    }

    // Check if vehicle has any ongoing trips
    const activeTrip = await Trip.findOne({
      Vehicle: vehicle.vehicleNum,
      isFinished: false,
    });

    if (activeTrip) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete vehicle while it has an active trip",
      });
    }

    // Remove vehicle reference from owner
    await Owner.findByIdAndUpdate(ownerId, { $pull: { Vehicle: vehicleId } });

    // Delete vehicle from database
    await Vehicle.findByIdAndDelete(vehicleId);

    // Optional: Update completed trips to mark vehicle as deleted
    await Trip.updateMany(
      { Vehicle: vehicle.vehicleNum },
      { $set: { Vehicle: "DELETED_VEHICLE" } },
    );

    res.status(200).json({
      success: true,
      message: "Vehicle deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting vehicle:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Helper function to calculate distance between coordinates
const calculateDistance = (trip) => {
  if (!trip.coordinateStart || !trip.coordinateEnd) return 0;
  // Implement distance calculation logic
  return 0; // Placeholder
};

// Helper function to calculate average speed
const calculateAverageSpeed = (trips) => {
  // Implement average speed calculation logic
  return 0; // Placeholder
};

// Helper function to calculate fuel efficiency
const calculateFuelEfficiency = (trips) => {
  // Implement fuel efficiency calculation logic
  return 0; // Placeholder
};
