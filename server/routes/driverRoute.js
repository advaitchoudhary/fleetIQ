const express = require("express");

const { create, getAllDrivers, getDriverById, updateDriverById, deleteDriverById } = require("../controller/driverController.js");

const route = express.Router();

route.post("/", create)
route.get("/drivers", getAllDrivers)
route.get("/driver/:id", getDriverById)
route.put("/update/driver/:id", updateDriverById)
route.delete("/delete/driver/:id", deleteDriverById)


module.exports = route;