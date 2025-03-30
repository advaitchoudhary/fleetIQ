import Driver from "../model/driverModel.js";
import asyncHandler from 'express-async-handler'; // npm install express-async-handler

export const create = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const driverExist = await Driver.findOne({ email });
  if (driverExist) {
    res.status(400).json({ message: "Driver already exists" });
    return;
  }
  const newDriver = new Driver(req.body);
  const savedData = await newDriver.save();
  res.status(201).json(savedData);
});

export const getAllDrivers = asyncHandler(async (req, res) => {
  const drivers = await Driver.find();
  if (!drivers.length) {
    res.status(404).json({ message: "No drivers found" });
    return;
  }
  res.json(drivers);
});

export const getDriverById = asyncHandler(async (req, res) => {
  const driver = await Driver.findById(req.params.id);
  if (!driver) {
    res.status(404).json({ message: "Driver not found" });
    return;
  }
  res.json(driver);
});

export const updateDriverById = asyncHandler(async (req, res) => {
  const updatedDriver = await Driver.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!updatedDriver) {
    res.status(404).json({ message: "Driver not found" });
    return;
  }
  res.json(updatedDriver);
});

export const deleteDriverById = asyncHandler(async (req, res) => {
  const driver = await Driver.findByIdAndDelete(req.params.id);
  if (!driver) {
    res.status(404).json({ message: "Driver not found" });
    return;
  }
  res.json({ message: "Driver deleted successfully" });
});