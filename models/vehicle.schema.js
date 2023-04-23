const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const VehicleSchema = new Schema({
  name: String,
  vehicleNum: { type: String, required: true },

  Trip: [
    {
      type: Schema.Types.ObjectId,
      ref: "Trip",
      autopopulate: true,
    },
  ],
  Owner: {
    type: Schema.Types.ObjectId,
    ref: "Owner",
    autopopulate: true,
  },
  isVerified: { type: String, default: "false" },
});
VehicleSchema.plugin(require("mongoose-autopopulate"));

module.exports = mongoose.model("Vehicle", VehicleSchema);
