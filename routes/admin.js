const express = require("express");
const router = express.Router();
const admin = require("../controllers/admin.controller");

//admin-dashborads

//main-dashboard
router.route("/main").get(admin.main);
//verify-dashboard
router.route("/verify").get(admin.verify);
//messages-dashboard
//vehicle-dashboard

//verification owner
router.route("/verifyOwner/:id").get(admin.ownerVerifyRender);
router.route("/verifyOwnerButton/:ownerId").get(admin.ownerVerify);
//verification driver
router.route("/verifyDriver/:id").get(admin.driverVerifyRender);
router.route("/verifyDriverButton/:driverId").get(admin.driverVerify);

//login
router.route("/login").get(admin.login).post(admin.loginVerify);

// router.route("/createAdmin").get(admin.createAdmin);

module.exports = router;
