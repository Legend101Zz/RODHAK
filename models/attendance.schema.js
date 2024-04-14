const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const AttendanceSchema = new Schema(
  {
    driver: {
      type: Schema.Types.ObjectId,
      ref: "Driver",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    trips: [
      {
        type: Schema.Types.ObjectId,
        ref: "Trip",
      },
    ],
    totalHours: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Attendance", AttendanceSchema);
