// cleanDatabase.js
const mongoose = require("mongoose");
require("dotenv").config();

// Import all models
const Owner = require("../models/owner.schema");
const Driver = require("../models/driver.schema");
const Vehicle = require("../models/vehicle.schema");
const Trip = require("../models/trip.schema");
const Admin = require("../models/admin.schema");
const Attendance = require("../models/attendance.schema");

async function cleanDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB...");

    // Clean all collections
    const collections = [Owner, Driver, Vehicle, Trip, Admin, Attendance];
    const collectionNames = [
      "Owner",
      "Driver",
      "Vehicle",
      "Trip",
      "Admin",
      "Attendance",
    ];

    for (let i = 0; i < collections.length; i++) {
      const result = await collections[i].deleteMany({});
      console.log(
        `Cleaned ${collectionNames[i]} collection: ${result.deletedCount} documents removed`,
      );
    }

    console.log("Database cleanup completed successfully!");
  } catch (error) {
    console.error("Error cleaning database:", error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log("Database connection closed.");
    process.exit(0);
  }
}

// Run the cleanup
cleanDatabase();
