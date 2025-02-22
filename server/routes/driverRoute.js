import express from "express"

import { create, getAllDrivers, getDriverById, updateDriverById, deleteDriverById } from "../controller/driverController.js"

const route = express.Router();

route.post("/driver", create)
route.get("/drivers", getAllDrivers)
route.get("/driver/:id", getDriverById)
route.put("/update/driver/:id", updateDriverById)
route.delete("/delete/driver/:id", deleteDriverById)


export default route;