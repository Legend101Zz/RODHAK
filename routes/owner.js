const express = require("express");
const router = express.Router();
const multer = require("multer");
const { storage } = require("../cloudinary/index");
const upload = multer({ storage });
const owners = require("../controllers/owner.controllers");

router
  .route("/register")
  .get(owners.renderRegister)
  .post(
    upload.fields([
      { name: "image", maxCount: 2 },
      { name: "legal", maxCount: 8 },
    ]),
    owners.register
  );
// router.route("/test").get(owners.test);
module.exports = router;
