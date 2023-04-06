const Driver = require("../models/driver.schema");
const generator = require("generate-password");

const bcrypt = require("bcrypt");

//mail-setup
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_MAIL,
    pass: process.env.GMAIL_PASSWORD,
  },
  port: 465,
  host: "smtp.gmail.com",
});

transporter.verify((error, success) => {
  if (error) {
    console.log(error);
  } else {
    console.log("Lets go babbyy");
  }
});

//testing

module.exports.renderRegister = (req, res) => {
  res.render("users/register2");
};

//driver register api
module.exports.DriverRegister = async (req, res, next) => {
  const obj = Object.assign({}, req.files);

  const { email, username, phone } = req.body;

  const user = await Driver.findOne({ email: req.body.email });
  if (user) {
    return res
      .status(409)
      .send({ message: "Driver with the given email already exists" });
  }

  const password = generator.generate({
    length: 8,
    numbers: true,
  });

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

    password: hashPassword,
  });

  driver.images = imagesArr.map((f) => ({ url: f.url, filename: f.filename }));
  driver.legal = legalArr.map((f) => ({ url: f.url, filename: f.filename }));

  await driver
    .save()
    .then((result) => {
      // console.log(result, "done");
      // res.render("users/wait");
      console.log(result);
      const mailOptions = {
        from: process.env.GMAIL_MAIL,
        to: email,
        subject: "Driver Registeration Process initiated successfully",
        html: `
        Dear ${username}, Thank you for as a driver  with us \n .Your credentials are :- email:- <b> ${email}</b> , password is :- <b> ${password}</b>. Please use this to login again after we get your details verified.`,
      };

      transporter.sendMail(mailOptions).then(() => {
        //email sent and verification saved

        res.render("users/wait");
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(201).json({
        type: "failure",
        message: "denial email not sent",
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

//Login
