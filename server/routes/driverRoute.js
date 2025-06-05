const express = require("express");

const {
  create,
  getAllDrivers,
  getDriverById,
  updateDriverById,
  deleteDriverById,
  checkUsername
} = require("../controller/driverController.js");

const route = express.Router();

route.post("/", create);
route.get("/", getAllDrivers);
route.put("/:id", updateDriverById);
route.delete("/:id", deleteDriverById);
route.get("/check", checkUsername);
route.get("/:id", getDriverById);

module.exports = route;