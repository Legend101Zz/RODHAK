const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ImageSchema = new Schema({
  url: String,
  filename: String,
});

const driverSchema = new Schema(
  {
    name: String,
    password: String,
    username: String,
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
    age: { type: String, required: true },
    images: [ImageSchema],
    legal: [ImageSchema],
    isVerified: { type: String, default: "false" },
    Trip: [
      {
        type: Schema.Types.ObjectId,
        ref: "Trip",
      },
    ],
    Owner: {
      type: Schema.Types.ObjectId,
      ref: "Owner",
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
  },
  { timestamps: true }
);
driverSchema.plugin(require("mongoose-autopopulate"));

module.exports = mongoose.model("Driver", driverSchema);
