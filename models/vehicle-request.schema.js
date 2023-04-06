const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const VehicleRequestSchema = new Schema({
  name: String,
  password: String,
  business: String,
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phone: {
    type: String,
    required: true,
    unique: true,
  },
  images: [ImageSchema],
  legal: [ImageSchema],
  isVerified: { type: String, default: "false" },
});

module.exports = mongoose.model("VehRequest", VehicleRequestSchema);
