const Owner = require("../models/owner.schema");
const Driver = require("../models/driver.schema");
const Admin = require("../models/admin.schema");
const bcrypt = require("bcrypt");
const Vehicle = require("../models/vehicle.schema");

//Main Dashboard
module.exports.main = async (req, res, next) => {
  const admin = req.session.adminId;
  if (admin) {
    const owners = await Owner.find();
    const drivers = await Driver.find();
    const vehicles = await Vehicle.find();
    console.log(drivers);
    res.render("admin/admin", {
      owners: owners,
      drivers: drivers,
      vehicles: vehicles,
    });
  } else {
    res.redirect("/api/v1/admin/login");
  }
};

//Owner Verify PAge

module.exports.ownerVerifyRender = async (req, res, next) => {
  const admin = req.session.adminId;
  const id = req.params.id;
  if (admin) {
    const owner = await Owner.findById(id);

    res.render("admin/cardOwner", { data: owner });
  } else {
    res.redirect("/api/v1/admin/login");
  }
};

//verify owner

module.exports.ownerVerify = async (req, res, next) => {
  const admin = req.session.adminId;
  const id = req.params.ownerId;
  console.log("check", id);
  if (admin) {
    const owner = await Owner.findByIdAndUpdate(id, { isVerified: "true" });
    console.log("verify", owner);
    res.redirect("/api/v1/admin/main");
  } else {
    res.redirect("/api/v1/admin/login");
  }
};

//Driver Verify PAge

module.exports.driverVerifyRender = async (req, res, next) => {
  const admin = req.session.adminId;
  const id = req.params.id;
  if (admin) {
    const driver = await Driver.findById(id);

    res.render("admin/cardDriver", { data: driver });
  } else {
    res.redirect("/api/v1/admin/login");
  }
};

//verify driver

module.exports.driverVerify = async (req, res, next) => {
  const admin = req.session.adminId;
  const id = req.params.driverId;
  console.log("check", id);
  if (admin) {
    await Driver.findOneAndUpdate(
      { _id: id },
      { isVerified: "true" },
      {
        new: true,
      }
    )
      .then((result) => {
        console.log("verify", result);
        res.redirect("/api/v1/admin/main");
      })
      .catch((err) => {
        console.log(err);
      });
  } else {
    res.redirect("/api/v1/admin/login");
  }
};

//Verify Dashboard
module.exports.verify = async (req, res, next) => {
  const drivers = await Driver.find({ isVerified: "false" });
  const owners = await Owner.find({ isVerified: "false" });

  const date = new Date();
  let day = date.getDate();
  let month = date.getMonth() + 1;
  let year = date.getFullYear();
  let currentDate = `${day}-${month}-${year}`;
  // console.log(currentDate);
  const admin = req.session.adminId;
  if (admin) {
    // for (let owner of owners) {
    //   console.log(owner);
    // }
    res.render("admin/verify", {
      date: currentDate,
      owners: owners,
      drivers: drivers,
    });
  } else {
    res.redirect("/api/v1/admin/login");
  }
};

//vehicles

//render page

module.exports.vehicleMain = async (req, res, next) => {
  const vehicles = await Vehicle.find({ isVerified: "false" });
  console.log(vehicles);
  res.render("admin/vehicle", { vehicles: vehicles });
};

//verify page

module.exports.vehicleVerifyRender = async (req, res, next) => {
  const admin = req.session.adminId;
  const id = req.params.id;
  if (admin) {
    const vehicle = await Vehicle.findById(id);

    res.render("admin/vehicleCard", { data: vehicle });
  } else {
    res.redirect("/api/v1/admin/login");
  }
};

//verify logic

module.exports.vehicleVerify = async (req, res, next) => {
  const admin = req.session.adminId;
  const id = req.params.vehicleId;
  console.log("check", id);
  if (admin) {
    const vehicle = await Vehicle.findByIdAndUpdate(id, { isVerified: "true" });
    console.log("verify", vehicle);
    res.redirect("/api/v1/admin/main");
  } else {
    res.redirect("/api/v1/admin/login");
  }
};

//admin-view-routes
module.exports.view = async (req, res, next) => {
  const drivers = await Driver.find();
  const owners = await Owner.find();
  console.log(drivers[0].isVerified);
  res.render("admin/cards", { drivers: drivers, owners: owners });
};

//creation of a new ADMIN

module.exports.createAdmin = async (req, res, next) => {
  const password = "dnd2rodhak#123@";
  const salt = await bcrypt.genSalt(Number(process.env.SALT));
  const hashPassword = await bcrypt.hash(password, salt);
  console.log(password, hashPassword);
  await new Admin({
    password: hashPassword,
    email: "dnd2rodhak@gmail.com",
  })
    .save()
    .then((result) => {
      res.status(201).json({
        type: "success",
        message: "Admin created successfully",
        data: result,
      });
    })
    .catch((err) => {
      res.status(201).json({
        type: "failure",
        message: "Error",
        data: err,
      });
    });
};

//ADMIN LOGIN

module.exports.login = async (req, res, next) => {
  res.render("admin/login");
};

module.exports.loginVerify = async (req, res, next) => {
  const password = req.body.password;
  const email = req.body.mail;
  const admin = await Admin.findOne({ email: email });
  console.log(req.body, admin.password);
  if (admin) {
    const validPassword = await bcrypt.compare(password, admin.password);
    console.log(validPassword);
    if (validPassword) {
      // console.log("hit");
      req.session.adminId = admin._id;
      res.redirect("/api/v1/admin/main");
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
};

//admin owner dashboard

module.exports.ownerDetails = async (req, res, next) => {
  const admin = req.session.adminId;
  const email = req.params.mail;
  console.log(email);
  if (admin) {
    const owner = await Owner.findOne({ email: email });

    console.log(owner);

    res.render("admin/individualDetails", { owner: owner });
  } else {
    res.redirect("/api/v1/admin/login");
  }
};

// edit Owner

module.exports.ownerEdit = async (req, res, next) => {
  const admin = req.session.adminId;
  const id = req.params.id;
  if (admin) {
    const owner = await Owner.findById(id);
    res.render("admin/editOwner", { owner: owner });
  } else {
    res.redirect("/api/v1/admin/login");
  }
};

module.exports.ownerEditPost = async (req, res, next) => {
  const admin = req.session.adminId;
  const id = req.params.id;
  const { username, phone, business } = req.body;
  if (admin) {
    console.log(id, username, phone, business);
    await Owner.findByIdAndUpdate(id, { username, phone, business })
      .then((result) => {
        console.log(result);
        res.redirect(`/api/v1/admin/main`);
      })
      .catch((err) => {
        console.log(err);
      });
  } else {
    res.redirect("/api/v1/admin/login");
  }
};
