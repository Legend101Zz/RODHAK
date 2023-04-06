const express = require("express");
const router = express.Router();
const admin = require("../controllers/admin.controller");

router.route("/main").get(admin.main);

router.route("/verify").get(admin.verify);
router.route("/login").get(admin.login).post(admin.loginVerify);

// router.route("/createAdmin").get(admin.createAdmin);

module.exports = router;
