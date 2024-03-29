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
    await Trip.findByIdAndUpdate(id, { isFinished: true })
      .then((result) => {
        // console.log(result);
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

  if (id) {
    // console.log(id);
    await Trip.findByIdAndUpdate(id, { isFinished: true })
      .then((result) => {
        // console.log(result);
        return res.status(200).json({
          type: "success",
          message: "trip ended",
        });
      })
      .catch((err) => {
        console.log(err);
        return res.status(501).json({
          type: "error",
          message: "internal server error",
        });
      });
  } else {
    return res.status(200).json({
      type: "error",
      message: "invalid trip id",
    });
  }
};

module.exports.loginVerifyApi = async (req, res, next) => {
  const plainPassword = req.body.password;
  const email = req.body.mail;

  try {
    const driver = await Driver.findOne({ email }).select(" -legal");

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
        "-_id isFinished isPublic Type Vehicle Start End start_time viaRoute"
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

module.exports.createTripApi = async (req, res, next) => {
  try {
    const id = req.body.driverId;
    if (id) {
      const start = req.body.source;
      const end = req.body.destination;
      const veh = req.body.vehicle;
      var numLower = req.body.vehicle.toLowerCase();
      const num = numLower.replace(/\W/g, "");
      const vehicle = await Vehicle.findOne({ vehicleNum: num });

      const starting = req.body.sourceLocation;
      const ending = req.body.destinationLocation;
      const viaRoute = req.body.viaRoute;
      const start_time = req.body.start_time;

      // console.log("req body check", req.body);

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
            viaRoute,
            start_time: start_time,
          });

          if (vehicle.isVerified == "false") {
            return res.status(201).json({
              type: "user error",
              message: "Vehicle not verified ",
            });
          }
          await trip
            .save()
            .then(async (result) => {
              // console.log(result, "result");
              await Vehicle.findOneAndUpdate(
                { vehicleNum: num },
                { $push: { Trip: result._id } }
              );

              await Driver.findByIdAndUpdate(id, {
                $push: { Trip: result._id },
              });

              return res.status(200).json({
                message: "success",
                data: {
                  start: starting,
                  ending: ending,
                  isTripPublic: check,
                  location1: start,
                  location2: end,
                  vehicle_num: veh,
                  viaRoute,
                  type: vehicle.Type,
                  TripId: result._id,
                  start_time: start_time,
                },
              });
            })
            .catch((err) => {
              console.log(err);
              return res.status(500).json({
                type: "server failure",
              });
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
            viaRoute,
            start_time: start_time,
          });

          if (vehicle.isVerified == "false") {
            return res.status(201).json({
              type: "user error",
              message: "Vehicle is not verified ",
            });
          }
          await trip
            .save()
            .then(async (result) => {
              await Vehicle.findOneAndUpdate(
                { vehicleNum: num },
                { $push: { Trip: result._id } }
              );
              await Driver.findByIdAndUpdate(id, {
                $push: { Trip: result._id },
              });

              return res.status(200).json({
                message: "success",
                data: {
                  start: starting,
                  ending: ending,
                  isTripPublic: check,
                  location1: start,
                  location2: end,
                  vehicle_num: veh,
                  type: vehicle.Type,
                  TripId: result._id,
                  viaRoute,
                  start_time: start_time,
                },
              });
            })
            .catch((err) => {
              console.log(err);
              return res.status(500).json({
                type: "server failure",
              });
            });
        }
      } else {
        return res.status(201).json({
          type: "user error",
          message: "Vehicle is not registered ",
        });
      }
    } else {
      return res.status(201).json({
        type: "user error",
        message: "Invalid driver ID ",
      });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      type: "server failure",
    });
  }
};

// ====== DRIVER REGISTER API =========

module.exports.DriverRegisterAPI = async (req, res) => {
  try {
    const obj = Object.assign({}, req.files);
    const { ownId, username, phone, email, age, password } = req.body;
    console.log(req.body, req.files);
    const user = await Driver.findOne({ email });
    const own = await Owner.findById(JSON.parse(ownId));

    if (user || !own) {
      return res.status(401).json({
        message: "Driver with the given email already exists",
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

    const savedDriver = await driver.save();
    await Owner.findByIdAndUpdate(
      { _id: own._id },
      { $push: { Driver: savedDriver._id } }
    );

    res.status(200).json({
      type: "success",
      message: "Driver registration successful!",
      driverId: savedDriver._id,
    });
    // Sending registration email
    // const mailOptions = {
    //   from: process.env.GMAIL_MAIL,
    //   to: email,
    //   subject: "Driver Registration Process initiated successfully",
    //   html: `Dear ${username}, Thank you for registering as a driver with us. Your credentials are: email - <b>${email}</b>, password - <b>${password}</b>. Please use this to login again after we get your details verified.`,
    // };

    // // Assume `transporter` is properly configured
    // transporter.sendMail(mailOptions, (error) => {
    //   if (error) {
    //     console.error(error);
    //     return res.status(500).json({
    //       type: "failure",
    //       message: "Email not sent",
    //     });
    //   }

    // });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      type: "failure",
      message: "Server error",
    });
  }
};
