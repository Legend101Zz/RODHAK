const Owner = require("../models/owner.schema");
const Driver = require("../models/driver.schema");
const Admin = require("../models/admin.schema");
const Vehicle = require("../models/vehicle.schema");
const Trip = require("../models/trip.schema");
const bcrypt = require("bcrypt");
var mongoose = require("mongoose");

// api for getting current coordinates

module.exports.api = async (req, res, next) => {
  console.log(req.session.tripId);
  const id = req.session.tripId;
  const longitude = req.body.data.long;
  const latitude = req.body.data.lat;
  const speed = req.body.data.speed;
  const coordinates = [longitude, latitude];
  console.log(coordinates);
  await Trip.findOneAndUpdate(
    { _id: id },
    { currentCoordinates: coordinates, Speed: speed }
  )
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
    const owner = await Owner.findOne(
      { email: req.body.email },
      { Driver: 0, Vehicle: 0 }
    );
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
  const trips = await Trip.find(
    {
      isFinished: false,
      isPublic: true,
    },
    {
      Driver: 0,
      coordinateStart: 0,
      coordinateEnd: 0,
      Speed: 0,
      isFinished: 0,
      isPublic: 0,
    }
  );
  console.log(trips, "hello1");
  res.status(200).send({ message: "Success", data: trips });
};

//api for giving current coordinates

module.exports.directions = async (req, res, next) => {
  const trip = await Trip.findById(req.params.id);
  if (trip) {
    res.status(200).send({ message: "Success", data: trip });
  } else {
    res.status(401).send({ message: "Invalid Trip id" });
  }
};

//getting singleTrip api for map
module.exports.trip = async (req, res, next) => {
  const trip = await Trip.findById(req.params.tripId);
  const vehicle = await Vehicle.find({ Trip: trip._id });
  console.log("Vehicle--->", vehicle[0].vehicleNum);
  if (trip) {
    res.status(200).send({
      message: "Success",
      data: {
        currentCoordinates: trip.currentCoordinates,
        Start: trip.coordinateStart,
        End: trip.coordinateEnd,
        Vehicle: vehicle[0].vehicleNum,
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
      res.render("map", { env: process.env.MAP_BOX });
    } else {
      res.status(401).send({ message: "Invalid Trip id" });
    }
  } catch (err) {
    console.log(err);
  }
};

//send individual owner data no vehicles and rest

module.exports.ownerData = async (req, res, next) => {
  console.log("checl");

  const id = req.params.id;
  const owner = await Owner.findById(id);
  console.log(owner);
  if (owner) {
    res.status(200).send({ message: "success", data: owner });
  } else {
    res.status(401).send({ message: "Invalid Owner id" });
  }
};
