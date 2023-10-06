const { date } = require("joi");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const TripSchema = new Schema({
  isFinished: { type: Boolean, default: false },
  isPublic: { type: Boolean, default: false },
  Type: { type: String, required: true },
  Driver: {
    type: Schema.Types.ObjectId,
    ref: "Driver",

    autopopulate: true,
  },
  Vehicle: {
    type: String,
  },
  Start: { type: String },
  End: { type: String },
  start_time: { type: String },
  coordinateStart: {
    type: [Number],
  },
  coordinateEnd: {
    type: [Number],
  },
});

TripSchema.plugin(require("mongoose-autopopulate"));

module.exports = mongoose.model("Trip", TripSchema);
