const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapboxtoken = process.env.MAP_BOX;
const geoCoder = mbxGeocoding({ accessToken: mapboxtoken });
const Driver = require("../models/driver.schema");
const Trip = require("../models/trip.schema");
const generator = require("generate-password");
const geo = require("mapbox-geocoding");
geo.setAccessToken(process.env.MAP_BOX);
const bcrypt = require("bcrypt");
const turf = require("@turf/distance");
const Owner = require("../models/owner.schema");
const Vehicle = require("../models/vehicle.schema");
const Attendance = require("../models/attendance.schema");
const {
  sendDriverRegistrationEmails,
  generatePasswordResetToken,
  sendDriverPasswordResetEmail,
} = require("../services/emailService");

//mail-setup
// const nodemailer = require("nodemailer");

// const transporter = nodemailer.createTransport({
//   service: "gmail",

//   auth: {
//     user: process.env.GMAIL_MAIL,
//     pass: process.env.GMAIL_MAIL,
//   },
//   port: 465,
//   host: "smtp.gmail.com",
// });

// transporter.verify((error, success) => {
//   if (error) {
//     console.log(process.env.GMAIL_MAIL, process.env.GMAIL_MAIL);
//     console.log(error);
//   } else {
//     //console.log("Lets go babbyy");
//   }
// });

//testing

module.exports.renderRegister = (req, res) => {
  res.render("driver/register2");
};

// Attendance Functions

async function createAttendanceRecord(driverId, tripId) {
  try {
    // Find the trip by the tripId
    const trip = await Trip.findById(tripId);

    // Calculate the total hours for the trip
    const totalHours = calculateTripHours(trip.start_time, trip.end_time);
    console.log("2", totalHours);
    // Create a new Attendance record
    const attendanceRecord = new Attendance({
      driver: driverId,
      date: new Date().toISOString().slice(0, 10),
      trips: [tripId],
    });

    // Save the attendance record
    await attendanceRecord.save();
    console.log("Attendance record created successfully.");
  } catch (error) {
    console.error("Error creating attendance record:", error);
  }
}

async function updateAttendanceOnTripEnd(tripId) {
  try {
    // Find the trip by the tripId
    const trip = await Trip.findById(tripId);
    // Calculate the total hours for the trip
    const { hours, minutes, seconds } = calculateTripHours(
      trip.start_time,
      trip.end_time
    );
    const totalHours = hours + minutes / 60 + seconds / 3600;
    // Find the attendance record for the driver on the date of the trip
    const attendanceRecord = await Attendance.findOne({
      driver: trip.Driver,
      date: new Date().toISOString().slice(0, 10),
    });

    if (attendanceRecord) {
      // Update the attendance record
      attendanceRecord.trips.push(tripId);
      attendanceRecord.totalHours += totalHours;
      await attendanceRecord.save();
      console.log("Attendance record updated successfully.");
    } else {
      // Create a new attendance record
      await createAttendanceRecord(trip.Driver, tripId);
    }
  } catch (error) {
    console.error("Error updating attendance record:", error);
  }
}
function calculateTripHours(startTime, endTime) {
  console.log("startTime, endTime", startTime, endTime);
  const startDate = parseTimeString(convertTo24Hour(startTime));
  const endDate = parseTimeString(convertTo24Hour(endTime));

  // Check if the start time is ahead of the end time
  if (startDate.getTime() > endDate.getTime()) {
    // If the start time is ahead of the end time, adjust the start date to the previous day
    startDate.setDate(startDate.getDate() - 1);
  }

  const durationInMilliseconds = endDate.getTime() - startDate.getTime();
  const durationInHours = durationInMilliseconds / (1000 * 60 * 60);
  const durationInMinutes =
    (durationInMilliseconds % (1000 * 60 * 60)) / (1000 * 60);
  const durationInSeconds = (durationInMilliseconds % (1000 * 60)) / 1000;

  return {
    hours: Math.floor(durationInHours),
    minutes: Math.floor(durationInMinutes),
    seconds: Math.floor(durationInSeconds),
  };
}

function parseTimeString(timeString) {
  const [hours, minutes, seconds] = timeString.split(":");

  let date = new Date();
  date.setHours(parseInt(hours, 10));
  date.setMinutes(parseInt(minutes, 10));
  date.setSeconds(parseInt(seconds, 10));
  date.setMilliseconds(0);

  // Adjust the date to Indian Standard Time (UTC+05:30)
  date.setHours(date.getHours() + 5);
  date.setMinutes(date.getMinutes() + 30);

  // If the hour is less than 0, it means the time is before midnight
  if (date.getHours() < 0) {
    // Adjust the date to the next day
    date.setDate(date.getDate() + 1);
  }

  return date;
}

function convertTo24Hour(timeString) {
  const [time, ampm] = timeString.split(" ");
  const [hours, minutes] = time.split(":");

  let hour = parseInt(hours, 10);
  if (ampm === "PM" && hour !== 12) {
    hour += 12;
  } else if (ampm === "AM" && hour === 12) {
    hour = 0;
  }

  return `${padZero(hour)}:${minutes}:00`;
}

function padZero(num) {
  return num.toString().padStart(2, "0");
}
//driver register api
module.exports.DriverRegister = async (req, res, next) => {
  const obj = Object.assign({}, req.files);
  try {
    const { email, username, phone, owner, age, password } = req.body;
    // console.log(req.body);
    const user = await Driver.findOne({ email });
    const own = await Owner.findOne({ email: owner });
    console.log(owner, own, user, "owner");
    if (user || !own) {
      return res.status(401).send({
        message:
          "Driver with the given email already exists or the Owner mail is not correct",
      });
    }

    const salt = await bcrypt.genSalt(Number(process.env.SALT));
    const hashPassword = await bcrypt.hash(password, salt);
    const imagesObj = obj.image;
    const legalObj = obj.legal;
    const imagesUrl = imagesObj[0].path;
    const imagesPath = imagesObj[0].filename;
    const legalUrl = legalObj[0].path;
    const legalPath = legalObj[0].filename;
    imagesArr = [{ url: imagesUrl, filename: imagesPath }];
    legalArr = [{ url: legalUrl, filename: legalPath }];

    const driver = new Driver({
      email: email,
      username: username,
      phone: phone,
      age: age,
      Owner: own._id,
      password: hashPassword,
    });

    driver.images = imagesArr.map((f) => ({
      url: f.url,
      filename: f.filename,
    }));
    driver.legal = legalArr.map((f) => ({ url: f.url, filename: f.filename }));

    await driver
      .save()
      .then(async (result) => {
        // console.log(result, "done");
        // res.render("users/wait");

        await Owner.findByIdAndUpdate(
          { _id: own._id },
          { $push: { Driver: result._id } }
        );

        // const mailOptions = {
        //   from: process.env.GMAIL_MAIL,
        //   to: email,
        //   subject: "Driver Registeration Process initiated successfully",
        //   html: `
        // Dear ${username}, Thank you for as a driver  with us \n .Your credentials are :- email:- <b> ${email}</b> , password is :- <b> ${password}</b>. Please use this to login again after we get your details verified.`,
        // };

        // transporter.sendMail(mailOptions).then(() => {
        //   //email sent and verification saved

        // });

        res.render("users/wait");
      })
      .catch((err) => {
        console.log(err);
        res.status(201).json({
          type: "failure",
          message: "server error",
        });
      })
      .catch((err) => {
        console.log(err);
      });
  } catch (e) {
    res.status(501).json({
      type: "failure",
      message: "server error",
    });
  }
};

//Login
module.exports.login = async (req, res, next) => {
  res.render("driver/login");
};

//verify login

module.exports.loginVerify = async (req, res, next) => {
  const password = req.body.password;
  const email = req.body.mail;
  try {
    const driver = await Driver.findOne({ email: email });
    // console.log(req.body, driver.password);
    if (driver) {
      // console.log(driver);
      const validPassword = await bcrypt.compare(password, driver.password);
      // console.log(validPassword);
      if (validPassword) {
        // console.log("hit");

        req.session.driverId = driver._id;
        res.redirect("/api/v1/driver/main");
      } else {
        // console.log("here");
        res.status(201).json({
          type: "failure",
          message: "Enter valid credentials",
        });
      }
    } else {
      res.status(201).json({
        type: "failure",
        message: "Enter valid credentials",
      });
    }
  } catch {
    res.status(201).json({
      type: "failure",
      message: "Enter valid credentials",
    });
  }
};

// Main Page

module.exports.main = async (req, res, next) => {
  const id = req.session.driverId;
  if (id) {
    // console.log(id);
    await Driver.findById(id)
      .then((result) => {
        // console.log(result);
        if (result.isVerified == "false") {
          res.render("driver/wait");
        } else {
          res.render("driver/main", { data: result });
        }
      })
      .catch((err) => {
        console.log(err);
      });
  } else {
    res.redirect("/api/v1/driver/login");
  }
};

//start form

module.exports.start = async (req, res, next) => {
  const id = req.session.driverId;
  if (id) {
    // console.log(id);

    res.render("driver/start");
  } else {
    res.redirect("/api/v1/driver/login");
  }
};

//creating trip
module.exports.trip = async (req, res, next) => {
  const id = req.session.driverId;
  if (id) {
    const start = req.body.start[0] + "," + req.body.start[1];
    const end = req.body.end[0] + "," + req.body.end[1];
    const veh = req.body.vehicle;
    const start_time = req.body.start_time;
    var numLower = req.body.vehicle.toLowerCase();
    const num = numLower.replace(/\W/g, "");
    const vehicle = await Vehicle.findOne({ vehicleNum: num });

    const geoData = await geoCoder
      .forwardGeocode({
        query: start,
        limit: 1,
      })
      .send();
    const geoData2 = await geoCoder
      .forwardGeocode({
        query: end,
        limit: 1,
      })
      .send();
    const starting = geoData.body.features[0].geometry.coordinates;
    const ending = geoData2.body.features[0].geometry.coordinates;

    // const distance = turf.default(starting, ending, { units: "kilometers" });

    // // console.log(distance, "km");
    if (vehicle) {
      if (req.body.public === "on") {
        let check = true;
        const trip = new Trip({
          isPublic: check,
          Driver: id,
          Vehicle: vehicle.vehicleNum,
          Type: vehicle.Type,
          coordinateStart: starting,
          coordinateEnd: ending,
          Start: start,
          End: end,
          start_time: start_time,
        });
        await trip
          .save()
          .then(async (result) => {
            // console.log(result);
            if (vehicle.isVerified == "false") {
              res.render("users/vehicle");
            } else {
              await Vehicle.findOneAndUpdate(
                { vehicleNum: num },
                { $push: { Trip: result._id } }
              );

              await Driver.findByIdAndUpdate(id, {
                $push: { Trip: result._id },
              });
              req.session.tripId = result._id;

              res.render("driver/sure", {
                start: starting,
                ending: ending,
                check: check,
                location1: start,
                location2: end,
                veh: veh,
                type: vehicle.Type,
                id: result._id,
                start_time: start_time,
              });
            }
          })
          .catch((err) => {
            console.log(err);
          });
      } else {
        let check = false;
        const trip = new Trip({
          isPublic: check,
          Driver: id,
          Vehicle: vehicle.vehicleNum,
          Type: vehicle.Type,
          coordinateStart: starting,
          coordinateEnd: ending,
          Start: start,
          End: end,
          start_time: start_time,
        });

        await trip
          .save()
          .then(async (result) => {
            if (vehicle.isVerified == "false") {
              res.render("users/vehicle");
            } else {
              await Vehicle.findOneAndUpdate(
                { vehicleNum: num },
                { $push: { Trip: result._id } }
              );
              await Driver.findByIdAndUpdate(id, {
                $push: { Trip: result._id },
              });

              req.session.tripId = result._id;

              res.render("driver/sure", {
                start: starting,
                ending: ending,
                check: check,
                location1: start,
                location2: end,
                veh: veh,
                type: vehicle.Type,
                id: result._id,
                start_time: start_time,
              });
            }
          })
          .catch((err) => {
            console.log(err);
          });
      }
    } else {
      res.render("users/vehicle2");
    }
  } else {
    res.redirect("/api/v1/driver/login");
  }
};

//showMap

module.exports.map = async (req, res, next) => {
  const id = req.session.tripId;
  const type = req.body.type;
  const trip = await Trip.findById(id);
  // console.log(trip);

  if (id) {
    res.render("driver/newMap", { trip: trip, type: type });
  } else {
    res.redirect("/api/v1/driver/login");
  }
};

//trip -finish

module.exports.end = async (req, res, next) => {
  const id = req.session.tripId;

  if (id) {
    // console.log(id);
    const endTime = new Date().toTimeString().split(" ")[0];
    await Trip.findByIdAndUpdate(id, { isFinished: true, end_time: endTime })
      .then(async (result) => {
        // console.log(result);
        await updateAttendanceOnTripEnd(id);
        res.redirect("/api/v1/driver/main");
      })
      .catch((err) => {
        console.log(err);
      });
  } else {
    res.redirect("/api/v1/driver/login");
  }
};

// --------------DRIVER APIS-----------------

module.exports.endTripApi = async (req, res, next) => {
  const id = req.body.tripId;

  if (!id) {
    return res.status(400).json({
      type: "error",
      message: "invalid trip id",
    });
  }

  try {
    const endTime = new Date().toTimeString().split(" ")[0];

    // Update trip status and end time
    const updatedTrip = await Trip.findByIdAndUpdate(
      id,
      { isFinished: true, end_time: endTime },
      { new: true }
    ).populate({
      path: "Driver",
      populate: {
        path: "Trip",
        model: "Trip",
      },
    });

    if (!updatedTrip) {
      return res.status(404).json({
        type: "error",
        message: "Trip not found",
      });
    }

    // Calculate trip duration
    const startTimeArr = updatedTrip.start_time.split(":");
    const endTimeArr = endTime.split(":");
    const durationInMinutes =
      parseInt(endTimeArr[0]) * 60 +
      parseInt(endTimeArr[1]) -
      (parseInt(startTimeArr[0]) * 60 + parseInt(startTimeArr[1]));

    // Get driver statistics
    const driver = updatedTrip.Driver;
    const totalTrips = driver.Trip.length;
    const completedTrips = driver.Trip.filter(
      (trip) => !trip.isFinished
    ).length;
    const ongoingTrips = driver.Trip.filter((trip) => trip.isFinished).length;

    // Calculate average trip duration for this driver
    const driverCompletedTrips = driver.Trip.filter(
      (trip) => trip.isFinished && trip.start_time && trip.end_time
    );

    let totalDuration = 0;
    driverCompletedTrips.forEach((trip) => {
      const tripStart = trip.start_time.split(":");
      const tripEnd = trip.end_time.split(":");
      const duration =
        parseInt(tripEnd[0]) * 60 +
        parseInt(tripEnd[1]) -
        (parseInt(tripStart[0]) * 60 + parseInt(tripStart[1]));
      totalDuration += duration;
    });

    const averageDuration =
      driverCompletedTrips.length > 0
        ? Math.round(totalDuration / driverCompletedTrips.length)
        : 0;

    // Get vehicle details
    const vehicle = await Vehicle.findOne({ vehicleNum: updatedTrip.Vehicle });

    // Update attendance
    await updateAttendanceOnTripEnd(id);

    return res.status(200).json({
      type: "success",
      message: "trip ended successfully",
      data: {
        trip: {
          id: updatedTrip._id,
          startLocation: updatedTrip.Start,
          endLocation: updatedTrip.End,
          viaLocation: updatedTrip.viaRoute,
          startTime: updatedTrip.start_time,
          endTime: updatedTrip.end_time,
          duration: durationInMinutes,
          type: updatedTrip.Type,
          isPublic: updatedTrip.isPublic,
          vehicleNum: updatedTrip.Vehicle,
        },
        driver: {
          id: driver._id,
          name: driver.username,
          phone: driver.phone,
          email: driver.email,
          stats: {
            totalTrips,
            completedTrips,
            ongoingTrips,
            averageTripDuration: averageDuration,
          },
        },
        vehicle: vehicle
          ? {
              id: vehicle._id,
              name: vehicle.name,
              type: vehicle.Type,
              totalTrips: vehicle.Trip.length,
            }
          : null,
      },
    });
  } catch (err) {
    console.error("Error ending trip:", err);
    return res.status(500).json({
      type: "error",
      message: "internal server error",
      error: err.message,
    });
  }
};

module.exports.loginVerifyApi = async (req, res, next) => {
  const plainPassword = req.body.password;
  const email = req.body.mail;

  try {
    const driver = await Driver.findOne({ email })
      .select(" -legal")
      .populate("Owner", "username phone business");

    if (!driver) {
      return res.status(401).json({
        type: "failure",
        message: "Invalid credentials",
      });
    }

    const passwordMatch = await bcrypt.compare(plainPassword, driver.password);

    if (!passwordMatch) {
      return res.status(401).json({
        type: "failure",
        message: "Invalid credentials",
      });
    }

    const totalTrips = driver.Trip.length.toString();
    const imageUrls = driver.images.map((image) => image.url);

    // Extract owner information
    const ownerInfo = driver.Owner
      ? {
          ownerId: driver.Owner._id,
          ownerName: driver.Owner.username || driver.Owner.business, // Use business if username isn't available
          ownerPhone: driver.Owner.phone,
        }
      : null;

    return res.status(200).json({
      message: "success",
      data: {
        _id: driver._id,
        name: driver.name,
        username: driver.username,
        email: driver.email,
        phone: driver.phone,
        age: driver.age,
        isVerified: driver.isVerified,
        totalTrips,
        imageUrls,
        owner: ownerInfo,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      type: "server failure",
      message: "Internal server error",
    });
  }
};

module.exports.getActiveTrips = async (req, res, next) => {
  const driverId = req.params.driverId;
  try {
    const activeTrips = await Trip.find({
      Driver: driverId,
      isFinished: false,
    })
      .select(
        "_id isFinished isPublic Type Vehicle coordinateStart coordinateEnd start_time via"
      )
      .lean();

    if (activeTrips.length != 0)
      activeTrips.forEach((trip) => {
        console.log(trip.Driver);
        delete trip.Driver;
      });

    return res.status(200).json({
      message: "success",
      data: activeTrips,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      type: "server failure",
      message: "Internal server error",
    });
  }
};

// Utility functions for coordinate handling
const coordinateUtils = {
  // Parse coordinates from various input formats
  parseCoordinates(input) {
    try {
      // If input is already an array of numbers
      if (
        Array.isArray(input) &&
        input.every((num) => typeof num === "number")
      ) {
        return input;
      }

      // If input is a string of array
      if (typeof input === "string") {
        // Handle stringified array
        const parsed = JSON.parse(input);
        if (Array.isArray(parsed)) {
          return parsed.map(Number);
        }
      }

      // If input is a string of coordinates
      if (typeof input === "string" && input.includes(",")) {
        return input.split(",").map((coord) => Number(coord.trim()));
      }

      throw new Error("Invalid coordinate format");
    } catch (error) {
      throw new Error(`Failed to parse coordinates: ${error.message}`);
    }
  },

  // Validate coordinates are within reasonable bounds
  validateCoordinates(coords) {
    if (!Array.isArray(coords) || coords.length !== 2) {
      throw new Error("Coordinates must be an array of 2 numbers");
    }

    const [lat, lng] = coords;
    if (isNaN(lat) || isNaN(lng)) {
      throw new Error("Coordinates must be valid numbers");
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new Error("Coordinates are outside valid range");
    }

    return true;
  },
};

// Vehicle validation functions
const vehicleUtils = {
  async validateVehicle(vehicleNumber) {
    const normalizedNumber = vehicleNumber.toLowerCase().replace(/\W/g, "");
    const vehicle = await Vehicle.findOne({ vehicleNum: normalizedNumber });

    if (!vehicle) {
      throw new Error("Vehicle is not registered");
    }

    if (vehicle.isVerified === "false") {
      throw new Error("Vehicle is not verified");
    }

    return vehicle;
  },

  async checkOngoingTrip(vehicleNumber) {
    const ongoingTrip = await Trip.findOne({
      Vehicle: vehicleNumber,
      isFinished: false,
    });

    if (ongoingTrip) {
      throw new Error("Vehicle is currently on a trip and cannot be used");
    }
  },
};
// ====== CREATE TRIP API =========
module.exports.createTripApi = async (req, res) => {
  try {
    const {
      driverId,
      source,
      destination,
      vehicle: vehicleNumber,
      starting,
      ending,
      via,
      viaRoute,
      start_time,
      public: isPublic,
    } = req.body;

    // Validate driver ID
    if (!driverId) {
      return res.status(400).json({
        type: "validation_error",
        message: "Driver ID is required",
      });
    }

    // Process and validate vehicle
    const vehicle = await vehicleUtils.validateVehicle(vehicleNumber);
    await vehicleUtils.checkOngoingTrip(vehicle.vehicleNum);

    // Process coordinates
    let processedCoordinates;
    try {
      processedCoordinates = {
        starting: coordinateUtils.parseCoordinates(starting),
        ending: coordinateUtils.parseCoordinates(ending),
        via: coordinateUtils.parseCoordinates(via),
      };

      // Validate all coordinates
      Object.values(processedCoordinates).forEach((coords) => {
        coordinateUtils.validateCoordinates(coords);
      });
    } catch (error) {
      return res.status(400).json({
        type: "validation_error",
        message: `Coordinate validation failed: ${error.message}`,
      });
    }

    // Create trip object
    const tripData = {
      isPublic: isPublic === "on",
      Driver: driverId,
      Vehicle: vehicle.vehicleNum,
      Type: vehicle.Type,
      coordinateStart: processedCoordinates.starting,
      coordinateEnd: processedCoordinates.ending,
      via: processedCoordinates.via,
      Start: source,
      End: destination,
      viaRoute,
      start_time,
    };

    // Save trip and update references
    const trip = new Trip(tripData);
    const savedTrip = await trip.save();

    // Update vehicle and driver records
    await Promise.all([
      Vehicle.findOneAndUpdate(
        { vehicleNum: vehicle.vehicleNum },
        { $push: { Trip: savedTrip._id } }
      ),
      Driver.findByIdAndUpdate(driverId, {
        $push: { Trip: savedTrip._id },
      }),
    ]);

    // Return success response
    return res.status(200).json({
      message: "success",
      data: {
        start: processedCoordinates.starting,
        ending: processedCoordinates.ending,
        isTripPublic: tripData.isPublic,
        location1: source,
        location2: destination,
        vehicle_num: vehicleNumber,
        viaRoute,
        via: processedCoordinates.via,
        type: vehicle.Type,
        TripId: savedTrip._id,
        start_time,
      },
    });
  } catch (error) {
    // Handle different types of errors
    const errorResponse = {
      type:
        error.name === "ValidationError" ? "validation_error" : "server_error",
      message: error.message,
    };

    const statusCode = errorResponse.type === "validation_error" ? 400 : 500;

    console.error("Trip creation error:", error);
    return res.status(statusCode).json(errorResponse);
  }
};

// ====== DRIVER REGISTER API =========

module.exports.getAttendance = async (req, res) => {
  try {
    const { driverId, date } = req.body;

    let query = { driver: driverId };

    if (date) {
      query.date = new Date(date).toISOString().slice(0, 10);
    }

    const attendanceRecords = await Attendance.find(query).populate("trips");

    const response = attendanceRecords.map((record) => ({
      id: record._id,
      driver: record.driver,
      date: record.date,
      totalHours: record.totalHours,
      trips: record.trips.map((trip) => ({
        isFinished: trip.isFinished,
        isPublic: trip.isPublic,
        Type: trip.Type,
        Vehicle: trip.Vehicle,
        Start: trip.Start,
        End: trip.End,
        start_time: trip.start_time,
        end_time: trip.end_time,
        viaRoute: trip.viaRoute ? trip.viaRoute : "Not valid",
      })),
    }));

    res.json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports.DriverRegisterAPI = async (req, res) => {
  try {
    const obj = Object.assign({}, req.files);
    const { ownId, username, phone, email, age, password } = req.body;
    console.log(req.body, req.files);

    // Check for existing driver
    const user = await Driver.findOne({ email });
    const own = await Owner.findById(ownId);

    if (user) {
      return res.status(401).json({
        message: "Driver with the given email already exists",
      });
    }

    if (!own) {
      return res.status(401).json({
        message:
          "You need to be associated with an owner fleet to proceded further",
      });
    }

    // Process images and create driver
    const salt = await bcrypt.genSalt(Number(process.env.SALT));
    const hashPassword = await bcrypt.hash(password, salt);

    const imagesObj = obj.image;
    const legalObj = obj.legal;
    const imagesUrl = imagesObj[0].path;
    const imagesPath = imagesObj[0].filename;
    const legalUrl = legalObj[0].path;
    const legalPath = legalObj[0].filename;

    const imagesArr = [{ url: imagesUrl, filename: imagesPath }];
    const legalArr = [{ url: legalUrl, filename: legalPath }];

    const driver = new Driver({
      email,
      username,
      phone,
      age,
      Owner: own._id,
      password: hashPassword,
      images: imagesArr.map((f) => ({ url: f.url, filename: f.filename })),
      legal: legalArr.map((f) => ({ url: f.url, filename: f.filename })),
    });

    // Save driver and update owner
    const savedDriver = await driver.save();
    await Owner.findByIdAndUpdate(
      { _id: own._id },
      { $push: { Driver: savedDriver._id } }
    );

    // Send notification emails
    const emailsSent = await sendDriverRegistrationEmails(
      { username, email, phone, age, password },
      {
        username: own.username,
        email: own.email,
        business: own.business,
      }
    );

    // Return response
    res.status(200).json({
      type: "success",
      message: "Driver registration successful!",
      driverId: savedDriver._id,
      emailsSent,
    });
  } catch (error) {
    console.error("Driver registration error:", error);
    res.status(500).json({
      type: "error",
      message: "An error occurred during registration",
      error: error.message,
    });
  }
};

/**
 * Get verified vehicles for a driver
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
module.exports.getDriverVerifiedVehicles = async (req, res) => {
  try {
    const driverId = req.params.driverId;
    const limit = parseInt(req.query.limit) || 5; // Default limit is 5

    // Find the driver to get the owner
    const driver = await Driver.findById(driverId).select("Owner");

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    // Find the verified vehicles associated with the owner
    const vehicles = await Vehicle.find({
      Owner: driver.Owner,
      isVerified: "true",
    })
      .select("vehicleNum name Type")
      .limit(limit);

    return res.status(200).json({
      success: true,
      count: vehicles.length,
      data: vehicles,
    });
  } catch (error) {
    console.error("Error fetching driver vehicles:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * Get trip history for a driver
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
module.exports.getDriverTripHistory = async (req, res) => {
  try {
    const driverId = req.params.driverId;
    const limit = parseInt(req.query.limit) || 5; // Default limit is 5

    // Check if driver exists (without auto-populating)
    const driverExists = await Driver.exists({ _id: driverId });

    if (!driverExists) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    // To avoid the autopopulate behavior, use a different approach
    const trips = await Trip.find({
      Driver: driverId,
      isFinished: true, // Only include completed trips
    })
      .populate({
        path: "Driver",
        select: "_id", // We need to select at least one field to make populate work
      })
      .select(
        "_id Start End start_time end_time isPublic Type Vehicle viaRoute"
      )
      .sort({ _id: -1 }) // Sort by _id in descending order (assuming ObjectId has timestamp)
      .limit(limit)
      .lean(); // Use lean() for better performance and to get plain objects

    // Remove the Driver field from the response
    const tripsWithoutDriver = trips.map((trip) => {
      const { Driver, ...tripWithoutDriver } = trip;
      return tripWithoutDriver;
    });

    // Calculate trip duration for each trip
    const tripsWithDuration = tripsWithoutDriver.map((trip) => {
      // Since we're already using lean(), the trip is already a plain object
      const tripData = { ...trip };

      // Calculate duration if both start and end times are available
      if (trip.start_time && trip.end_time) {
        const duration = calculateTripDuration(trip.start_time, trip.end_time);
        tripData.duration = duration;
      }

      return tripData;
    });

    return res.status(200).json({
      success: true,
      count: tripsWithDuration.length,
      data: tripsWithDuration,
    });
  } catch (error) {
    console.error("Error fetching driver trip history:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * Calculate the duration between two time strings
 * @param {String} startTime - Start time string in format "HH:MM AM/PM"
 * @param {String} endTime - End time string in format "HH:MM AM/PM"
 * @returns {Object} Object containing hours, minutes and total minutes
 */
function calculateTripDuration(startTime, endTime) {
  // Convert time strings to standardized 24-hour format
  const start24 = convertTo24Hour(startTime);
  const end24 = convertTo24Hour(endTime);

  // Parse the time strings
  const [startHours, startMinutes] = start24.split(":").map(Number);
  const [endHours, endMinutes] = end24.split(":").map(Number);

  // Calculate total minutes for both times
  let startTotalMinutes = startHours * 60 + startMinutes;
  let endTotalMinutes = endHours * 60 + endMinutes;

  // Handle overnight trips
  if (endTotalMinutes < startTotalMinutes) {
    endTotalMinutes += 24 * 60; // Add 24 hours
  }

  // Calculate difference in minutes
  const diffMinutes = endTotalMinutes - startTotalMinutes;

  // Calculate hours and remaining minutes
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;

  return {
    hours,
    minutes,
    totalMinutes: diffMinutes,
  };
}

/**
 * Convert 12-hour time format to 24-hour format
 * @param {String} timeString - Time string in format "HH:MM AM/PM"
 * @returns {String} 24-hour format time string "HH:MM"
 */
function convertTo24Hour(timeString) {
  const [timePart, ampm] = timeString.split(" ");
  let [hours, minutes] = timePart.split(":").map(Number);

  if (ampm === "PM" && hours < 12) {
    hours += 12;
  } else if (ampm === "AM" && hours === 12) {
    hours = 0;
  }

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;
}

// ========= Password reset functionality ===============

// Handle password reset request
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Find the driver by email
    const driver = await Driver.findOne({ email });

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "No account with that email address exists",
      });
    }

    // Generate a reset token
    const resetToken = generatePasswordResetToken();

    // Set token and expiration (1 hour)
    driver.resetPasswordToken = resetToken;
    driver.resetPasswordExpires = Date.now() + 3600000; // 1 hour

    await driver.save();

    // Send reset email
    const emailSent = await sendDriverPasswordResetEmail(driver, resetToken);

    if (emailSent) {
      return res.status(200).json({
        success: true,
        message: "Password reset email sent",
      });
    } else {
      driver.resetPasswordToken = undefined;
      driver.resetPasswordExpires = undefined;
      await driver.save();

      return res.status(500).json({
        success: false,
        message: "Failed to send password reset email",
      });
    }
  } catch (error) {
    console.error("Error in forgotPassword:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while processing your request",
    });
  }
};

// Render reset password form
exports.resetPasswordForm = async (req, res) => {
  try {
    const { token } = req.params;

    // Find driver with valid token
    const driver = await Driver.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!driver) {
      return res.render("driver/reset-password-error", {
        message: "Password reset token is invalid or has expired",
      });
    }

    // Render password reset form
    res.render("driver/reset-password", {
      token,
      email: driver.email,
    });
  } catch (error) {
    console.error("Error in resetPasswordForm:", error);
    res.render("driver/reset-password-error", {
      message: "An error occurred. Please try again.",
    });
  }
};

// Process reset password form submission
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    // Basic validation
    if (password !== confirmPassword) {
      return res.render("driver/reset-password", {
        token,
        error: "Passwords do not match",
      });
    }

    // Find driver with valid token
    const driver = await Driver.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!driver) {
      return res.render("driver/reset-password-error", {
        message: "Password reset token is invalid or has expired",
      });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(Number(process.env.SALT));
    const hashPassword = await bcrypt.hash(password, salt);

    // Update driver's password and clear reset token
    driver.password = hashPassword;
    driver.resetPasswordToken = undefined;
    driver.resetPasswordExpires = undefined;

    await driver.save();

    // Render success page
    res.render("driver/reset-password-success");
  } catch (error) {
    console.error("Error in resetPassword:", error);
    res.render("driver/reset-password-error", {
      message: "An error occurred while resetting your password",
    });
  }
};

// API version of forgot password for mobile app
exports.forgotPasswordApi = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Find the driver by email
    const driver = await Driver.findOne({ email });

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "No account with that email address exists",
      });
    }

    // Generate a reset token
    const resetToken = generatePasswordResetToken();

    // Set token and expiration (1 hour)
    driver.resetPasswordToken = resetToken;
    driver.resetPasswordExpires = Date.now() + 3600000; // 1 hour

    await driver.save();

    // Send reset email
    const emailSent = await sendDriverPasswordResetEmail(driver, resetToken);

    if (emailSent) {
      return res.status(200).json({
        success: true,
        message: "Password reset email sent successfully",
        data: {
          email: driver.email,
        },
      });
    } else {
      // Clean up if email fails
      driver.resetPasswordToken = undefined;
      driver.resetPasswordExpires = undefined;
      await driver.save();

      return res.status(500).json({
        success: false,
        message: "Failed to send password reset email. Please try again later.",
      });
    }
  } catch (error) {
    console.error("Error in forgotPasswordApi:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while processing your request",
    });
  }
};
