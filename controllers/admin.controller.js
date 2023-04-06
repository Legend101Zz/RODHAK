const Owner = require("../models/owner.schema");
const Driver = require("../models/driver.schema");
const Admin = require("../models/admin.schema");
const bcrypt = require("bcrypt");

//Main Dashboard
module.exports.main = async (req, res, next) => {
  const owners = await Owner.find();
  console.log(owners);
  res.render("admin/admin", { owners: owners });
};

//Verify Dashboard
module.exports.verify = (req, res, next) => {
  const date = new Date();
  let day = date.getDate();
  let month = date.getMonth() + 1;
  let year = date.getFullYear();
  let currentDate = `${day}-${month}-${year}`;
  console.log(currentDate);
  res.render("admin/verify", { date: currentDate });
};

//admin-view-routes
module.exports.view = async (req, res, next) => {
  const drivers = await Driver.find();
  const owners = await Owner.find();
  console.log(drivers[0].isVerified);
  res.render("admin/cards", { drivers: drivers, owners: owners });
};

//admin-login

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
      console.log("hit");
      res.status(201).json({
        type: "success",
        message: "Login successful",
      });
    } else {
      console.log("here");
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
