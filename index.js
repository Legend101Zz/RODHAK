if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const path = require("path");
const mongoose = require("mongoose");

//ROUTES
const ownerRoutes = require("./routes/owner");
const driverRoutes = require("./routes/driver");
const adminRoutes = require("./routes/admin");
const vehicleRoutes = require("./routes/vehicle");

//API_ROUTES
const apiRoutes = require("./routes/api");

const cors = require("cors");
const session = require("express-session");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(cors());

app.use(express.static(path.join(__dirname, "public")));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const sessionConfig = {
  secret: "thisshouldbeabettersecret!",
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
};

app.use(session(sessionConfig));

//TESTING-ROUTES

/* app.get("/", (req, res) => {
 res.render("map");
 });

 */
app.get("/test", (req, res) => {
  res.render("allMap");
});

//MAIN-ROUTES

app.use("/api/v1/owner", ownerRoutes);
app.use("/api/v1/driver", driverRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/vehicle", vehicleRoutes);

//API_ROUTES
app.use("/himraahi/", apiRoutes);

//ROUTE TO HANDLE RANDOM URLS

app.all("*", (req, res, next) => {
  next(res.render("error"));
});

// SERVER CONNECTION
mongoose
  .connect(process.env.MONGODB_URI)
  .then((result) => {
    console.log("Database Connected!!");
    const server = app.listen(port);
  })
  .catch((err) => {
    console.log(err);
  });
