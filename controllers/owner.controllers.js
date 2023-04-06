const Owner = require("../models/owner.schema");
const bcrypt = require("bcrypt");
// creating mail service
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

//render registeration form \

module.exports.renderRegister = (req, res) => {
  res.render("users/register");
};

//post registration form

module.exports.register = async (req, res, next) => {
  try {
    const user = await Owner.findOne({ email: req.body.email });
    if (user) {
      return res
        .status(409)
        .send({ message: "Owner with the given email already exists" });
    }
    console.log("hiit");

    const { email, username, password, phone, business } = req.body;
    const obj = Object.assign({}, req.files);

    const imagesObj = obj.image;
    const legalObj = obj.legal;
    const imagesUrl = imagesObj[0].path;
    const imagesPath = imagesObj[0].filename;
    const legalUrl = legalObj[0].path;
    const legalPath = legalObj[0].filename;
    imagesArr = [{ url: imagesUrl, filename: imagesPath }];
    legalArr = [{ url: legalUrl, filename: legalPath }];
    const salt = await bcrypt.genSalt(Number(10));
    const hashPassword = await bcrypt.hash(req.body.password, salt);
    const owner = new Owner({
      email: email,
      username: username,
      phone: phone,
      business: business,
      password: hashPassword,
    });

    owner.images = imagesArr.map((f) => ({ url: f.url, filename: f.filename }));
    owner.legal = legalArr.map((f) => ({ url: f.url, filename: f.filename }));

    await owner
      .save()
      .then((result) => {
        // console.log(result, "done");
        // res.render("users/wait");
        console.log(result);
        const mailOptions = {
          from: process.env.GMAIL_MAIL,
          to: email,
          subject: "Welcome to Rodhak.",
          html: `
        Dear ${username}, Thank you for registering your business ${business} with us \n .Your credentials are :- email:- <b> ${email}</b> , password is :- <b> ${password}</b>. Please use this to login again after we get your details verified.`,
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
  } catch (e) {
    console.log(e);
  }
};

//login

module.exports.login = async (req, res, next) => {
  try {
    const owner = await Owner.findOne({ email: req.body.email });
    if (!owner) {
      return res.status(401).send({ message: "Invalid email or password" });
    }
    const validPassword = await bcrypt.compare(
      req.body.password,
      owner.password
    );
    if (!validPassword) {
      return res.status(401).send({ message: "Invalid password or Password" });
    }
    const token = owner.generateAuthToken();
    res.status(200).send({ data: token, message: "Logged In successfully" });
  } catch (error) {
    res.status(500).send({ message: "Internal Server Error" });
  }
};

//check if working
