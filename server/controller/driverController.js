const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Driver = require("../model/driverModel.js");
const asyncHandler = require("express-async-handler");

const create = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const driverExist = await Driver.findOne({ email });
  if (driverExist) {
    res.status(400).json({ message: "Driver already exists" });
    return;
  }
  const newDriver = new Driver({
    ...req.body,
    plainPassword: req.body.password // save plainPassword too
  });
  const savedData = await newDriver.save();
  res.status(201).json(savedData);
});

const getAllDrivers = asyncHandler(async (req, res) => {
  const drivers = await Driver.find().lean(); // lean() for faster read

  const enhancedDrivers = drivers.map(driver => {
    let plainPassword = "";

    if (driver.plainPassword) {
      plainPassword = driver.plainPassword;
    } else if (driver.password && !driver.password.startsWith("$2b$")) {
      plainPassword = driver.password;
    }

    return {
      ...driver,
      plainPassword
    };
  });

  if (!enhancedDrivers.length) {
    res.status(404).json({ message: "No drivers found" });
    return;
  }
  res.json(enhancedDrivers);
});

const getDriverById = asyncHandler(async (req, res) => {
  const driver = await Driver.findById(req.params.id);
  if (!driver) {
    res.status(404).json({ message: "Driver not found" });
    return;
  }
  res.json(driver);
});

const driverLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    const driver = await Driver.findOne({ username });
    if (!driver) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const isMatch = await bcrypt.compare(password, driver.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const token = jwt.sign(
      { id: driver._id, role: "driver" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      token,
      driver: {
        id: driver._id,
        username: driver.username,
        name: driver.name,
        email: driver.email,
        role: "driver"
      }
    });
  } catch (error) {
    console.error("Driver login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Change Password for Driver
const changePassword = async (req, res) => {
  try {
    const token = req.header("Authorization")?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized - No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { oldPassword, newPassword, driverId } = req.body;

    // Determine which driver to update
    let driverToUpdate;
    if (decoded.role === "admin") {
      // Admin: must provide driverId
      if (!driverId) return res.status(400).json({ error: "driverId is required when changing another driver's password" });
      driverToUpdate = await Driver.findById(driverId);
    } else if (decoded.role === "driver") {
      // Driver: change own password
      driverToUpdate = await Driver.findById(decoded.id);
    } else {
      return res.status(403).json({ error: "Access denied" });
    }

    if (!driverToUpdate) return res.status(404).json({ error: "Driver not found" });

    // If Driver is changing own password → verify old password
    if (decoded.role === "driver") {
      const isMatch = await bcrypt.compare(oldPassword, driverToUpdate.password);
      if (!isMatch) return res.status(400).json({ error: "Old password is incorrect" });
    }

    // Set new password
    driverToUpdate.password = await bcrypt.hash(newPassword, 10);
    driverToUpdate.plainPassword = newPassword;
    await driverToUpdate.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Driver changePassword Error:", error);
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      res.status(401).json({ message: "Invalid token" });
    } else {
      res.status(500).json({ error: "Server error" });
    }
  }
};

const updateDriverById = asyncHandler(async (req, res) => {
  const updatedDriver = await Driver.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!updatedDriver) {
    res.status(404).json({ message: "Driver not found" });
    return;
  }
  res.json(updatedDriver);
});

const deleteDriverById = asyncHandler(async (req, res) => {
  const driver = await Driver.findByIdAndDelete(req.params.id);
  if (!driver) {
    res.status(404).json({ message: "Driver not found" });
    return;
  }
  res.json({ message: "Driver deleted successfully" });
});

const checkUsername = asyncHandler(async (req, res) => {
  const { username } = req.query;
  if (!username) {
    return res.status(400).json({ message: "Username query parameter is required" });
  }
  const userExists = await Driver.exists({ username: username.trim() });
  res.json({ exists: !!userExists });
});


module.exports = {
  create,
  getAllDrivers,
  getDriverById,
  updateDriverById,
  deleteDriverById,
  checkUsername,
  changePassword,
  driverLogin
};
