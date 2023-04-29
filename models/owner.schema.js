const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const passwordComplexity = require("joi-password-complexity");

const ImageSchema = new Schema({
  url: String,
  filename: String,
});

const OwnerSchema = new Schema(
  {
    username: String,
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
    Driver: [
      {
        type: Schema.Types.ObjectId,
        ref: "Driver",
        autopopulate: { select: "email" },
      },
    ],
    Vehicle: [
      {
        type: Schema.Types.ObjectId,
        ref: "Vehicle",
        autopopulate: { select: "vehicleNum" },
      },
    ],
  },
  { timestamps: true }
);

OwnerSchema.plugin(require("mongoose-autopopulate"));

OwnerSchema.methods.generateAuthToken = function () {
  const token = jwt.sign({ _id: this._id }, process.env.JWTSECRETKEY, {
    expiresIn: "1d",
  });
  return token;
};
module.exports = mongoose.model("Owner", OwnerSchema);
