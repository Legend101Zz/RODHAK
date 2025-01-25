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
router.route("/vehicle").get(admin.vehicleMain);

//owner-details

router.route("/ownerDetails/:mail").get(admin.ownerDetails);

//verification owner
router.route("/verifyOwner/:id").get(admin.ownerVerifyRender);
router.route("/verifyOwnerButton/:ownerId").get(admin.ownerVerify);
//verification driver
router.route("/verifyDriver/:id").get(admin.driverVerifyRender);
router.route("/verifyDriverButton/:driverId").get(admin.driverVerify);
//verification vehicle
router.route("/verifyVehicle/:id").get(admin.vehicleVerifyRender);
router.route("/verifyVehicleButton/:vehicleId").get(admin.vehicleVerify);

//editing routes here

router.route("/editOwner/:id").get(admin.ownerEdit).post(admin.ownerEditPost);

//login
router.route("/login").get(admin.login).post(admin.loginVerify);

router.route("/createAdmin").get(admin.createAdmin);

module.exports = router;
