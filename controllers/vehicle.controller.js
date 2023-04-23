const Owner = require("../models/owner.schema");
const Vehicle = require("../models/vehicle.schema");

//vehicle-registration post request

module.exports.register = (req, res, next) => {
  console.log(req.body);

  var numLower = req.body.vehicleNum.toLowerCase();
  const num = numLower.replace(/\W/g, "");

  console.log(num);

  const vehicle = new Vehicle({
    name: req.body.name,
    vehicleNum: num,

    Owner: req.body.id,
  });

  vehicle
    .save()
    .then(async (result) => {
      console.log("her");
      await Owner.findByIdAndUpdate(
        { _id: req.body.id },
        { $push: { Vehicle: result._id } }
      );
      res.status(200).send({
        message: "Success Vehicle registeration complete",
        data: result,
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(200).send({
        message: "Error",
        error: err,
      });
    });
};
