//Not used for now
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const adminDataSchema = new Schema({
  Drivers: Number,
  Owners: Number,
  Users: Number,
  Vehicles: Number,
  verifyDriver: Number,
  verifyOwner: Number,
});

module.exports = mongoose.model("adminData", adminDataSchema);
