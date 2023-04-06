const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ImageSchema = new Schema({
  url: String,
  filename: String,
});

const driverSchema = new Schema({
  name: String,
  password: String,
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

module.exports = mongoose.model("Driver", driverSchema);
