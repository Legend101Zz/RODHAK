const Owner = require("../models/owner.schema");
const Driver = require("../models/driver.schema");
const Admin = require("../models/admin.schema");
const Trip = require("../models/trip.schema");
const bcrypt = require("bcrypt");
var mongoose = require("mongoose");

// api for getting current coordinates

module.exports.api = async (req, res, next) => {
  console.log(req.session.tripId);
  const id = req.session.tripId;
  const longitude = req.body.data.long;
  const latitude = req.body.data.lat;
  const coordinates = [longitude, latitude];
  console.log(coordinates);
  await Trip.findByIdAndUpdate(id, { currentCoordinates: coordinates })
    .then((result) => {
      console.log(result);
    })
    .catch((err) => {
      console.log(err);
    });
};
//owner login

module.exports.owner = async (req, res, next) => {
  try {
    console.log(req.body);
    const owner = await Owner.findOne({ email: req.body.email });
    console.log(owner);
    if (!owner)
      return res.status(401).send({ message: "Invalid Email or Password" });
    const validPassword = await bcrypt.compare(
      req.body.password,
      owner.password
    );
    if (!validPassword)
      return res.status(401).send({ message: "Invalid Password or Email" });

    const token = owner.generateAuthToken();
    res.status(200).send({ message: "success", data: owner, token: token });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
};

//all trips api
module.exports.trips = async (req, res, next) => {
  const trips = await Trip.find().where("isPublic").equals("true");
  console.log(trips);
  res.status(200).send({ message: "Success", data: trips });
};

//api for giving current coordinates

module.exports.directions = async (req, res, next) => {
  console.log(req.body);
  const trip = await Trip.findById(req.body.id);
  if (trip) {
    res.status(200).send({ message: "Success", data: trip });
  } else {
    res.status(401).send({ message: "Invalid Trip id" });
  }
};

//getting singleTrip api for m
module.exports.trip = async (req, res, next) => {
  const trip = await Trip.findById(req.params.tripId);
  if (trip) {
    res
      .status(200)
      .send({
        message: "Success",
        data: {
          currentCoordinates: trip.currentCoordinates,
          Start: trip.coordinateStart,
          End: trip.coordinateEnd,
        },
      });
  } else {
    res.status(401).send({ message: "Invalid Trip id" });
  }
};

//map-rendering
module.exports.singleTrip = async (req, res, next) => {
  console.log(req.params.tripId);
  try {
    const check = req.params.tripId;
    // console.log(mongoose.Types.ObjectId.isValid(req.params.tripId));
    // console.log(mongoose.Types.ObjectId.isValid("643cacfc4d0fdb5ff3e79343"));
    // const id = toString(check);
    // console.log(check, id);
    const trip = await Trip.findById(check);
    console.log(trip);
    if (trip) {
      res.render("map");
    } else {
      res.status(401).send({ message: "Invalid Trip id" });
    }
  } catch (err) {
    console.log(err);
  }
};
