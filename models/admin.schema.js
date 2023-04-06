const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const AdminSchema = new Schema({
  password: String,
  email: {
    type: String,
  },
});

module.exports = mongoose.model("Admin", AdminSchema);
