if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const path = require("path");
const mongoose = require("mongoose");
const ownerRoutes = require("./routes/owner");
const driverRoutes = require("./routes/driver");
const adminRoutes = require("./routes/admin");
const cors = require("cors");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(cors());

app.use(express.static(path.join(__dirname, "public")));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get("/", (req, res) => {
  const data = [];
  res.render("map", { data });
  console.log(data);
});
app.get("/test", (req, res) => {
  res.render("getMap");
});
app.use("/api/v1/owner", ownerRoutes);
app.use("/api/v1/driver", driverRoutes);
app.use("/api/v1/admin", adminRoutes);

app.all("*", (req, res, next) => {
  next(res.render("error"));
});

mongoose
  .connect(process.env.MONGODB_URI)
  .then((result) => {
    console.log("Database Connected!!");
    const server = app.listen(port);
    const io = require("./socket").init(server);
    io.on("connection", (socket) => {
      console.log("some one is here", socket.id);
    });
  })
  .catch((err) => {
    console.log(err);
  });
