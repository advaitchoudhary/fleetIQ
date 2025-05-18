const express = require("express");

const { create, getAllDrivers, getDriverById, updateDriverById, deleteDriverById } = require("../controller/driverController.js");

const route = express.Router();

route.post("/", create)
route.get("/", getAllDrivers)
route.get("/:id", getDriverById)
route.put("/:id", updateDriverById)
route.delete("/:id", deleteDriverById)


module.exports = route;