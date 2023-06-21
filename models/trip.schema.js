const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const TripSchema = new Schema({
  isFinished: { type: Boolean, default: false },
  isPublic: { type: Boolean, default: false },
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
  Speed: { type: Number, default: 0 },

  currentCoordinates: {
    type: [Number],
  },

  coordinateStart: {
    type: [Number],
  },
  coordinateEnd: {
    type: [Number],
  },
});

TripSchema.plugin(require("mongoose-autopopulate"));

module.exports = mongoose.model("Trip", TripSchema);
