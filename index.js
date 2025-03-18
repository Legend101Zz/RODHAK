if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const faker = require("faker");
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const path = require("path");
const mongoose = require("mongoose");
const socketio = require("socket.io");

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

// CORS Configuration
const corsOptions = {
  origin:
    process.env.NODE_ENV === "production"
      ? "https://owner-dnd-rodhak.onrender.com"
      : [
          "http://localhost:5001",
          "http://localhost:3000",
          "https://owner-dnd-rodhak.onrender.com",
        ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true, // This is important for cookies/credentials
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

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

// app.get("/", (req, res) => {
//   res.render("driver/newMap");
// });

// Map Public view
app.get("/map", (req, res) => {
  res.render("allMap", { env: process.env.MAP_BOX });
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
    console.log("Listening on port :", port);
    const io = socketio(server, { cors: { origin: "*" } });

    io.on("connection", (socket) => {
      console.log("client connected ");
      // ========= CODE TO CHECK //////////
      let data;
      let data2;
      setInterval(() => {
        const latitude = parseFloat(faker.address.latitude());
        const longitude = parseFloat(faker.address.longitude());

        data = {
          tripID: "677ad2da5251c28ae04ec8b2",
          latitude: latitude,
          longitude: longitude,
          sourceLocation: "Mandi,HP",
          destinationLocation: "Chandigarh",
          viaLocation: "Via",
          currentTime: new Date().toLocaleTimeString(),
        };
        console.log("veh 1 ", data.latitude, data.longitude);
        if (
          data &&
          data.latitude >= -90 &&
          data.latitude <= 90 &&
          data.longitude >= -180 &&
          data.longitude <= 180
        )
          socket.broadcast.emit("broadcastDriverData", data);
      }, 20000);

      setInterval(() => {
        const latitude = parseFloat(faker.address.latitude());
        const longitude = parseFloat(faker.address.longitude());

        data2 = {
          tripID: "677ad2da5251c28ae04ec8b2",
          latitude: latitude,
          longitude: longitude,
          sourceLocation: "Kullu, H.P",
          destinationLocation: "Shimla ,H.P",
          viaLocation: "Via",
          currentTime: new Date().toLocaleTimeString(),
        };
        console.log("veh 2 ", data2.latitude);
        if (data2) socket.broadcast.emit("broadcastDriverData", data2);
      }, 20000);

      // ========= CODE TO CHECK ENDS //////////

      // socket.on("driverData", async (data) => {
      //   // Broadcast data to all connected users (excluding the sender)
      //   console.log("inside driver event");
      //   console.log(
      //     "Driver_DATA",
      //     data,
      //     // data["longitude"],
      //     // data[latitude],
      //     JSON.parse(data)
      //   );
      //   setTimeout(() => {
      //     socket.broadcast.emit("broadcastDriverData", JSON.parse(data));
      //   }, 5000);
      // });
    });
  })
  .catch((err) => {
    console.log(err);
  });
