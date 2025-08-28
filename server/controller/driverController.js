const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Driver = require("../model/driverModel.js");
const Timesheet = require("../model/timesheetModel.js");
const asyncHandler = require("express-async-handler");

// Utility function to calculate hours from start and end times
const calculateHours = (startTime, endTime) => {
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);

  let start = new Date();
  start.setHours(startH, startM, 0, 0);

  let end = new Date();
  end.setHours(endH, endM, 0, 0);

  // If end is before start (overnight shift), add 1 day
  if (end < start) {
    end.setDate(end.getDate() + 1);
  }

  const diffMs = end.getTime() - start.getTime();
  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const hours = totalMinutes / 60; // Convert to decimal hours

  return hours;
};

// Helper function to parse stored totalHours string format
const parseStoredTotalHours = (totalHoursString) => {
  if (!totalHoursString || typeof totalHoursString !== 'string') return 0;
  
  // Parse format like "8 hr 30 min" or "2 hr" or "45 min"
  const match = totalHoursString.match(/(\d+)\s*hr\s*(\d+)\s*min|(\d+)\s*hr|(\d+)\s*min/);
  if (!match) return 0;
  
  const hours = parseInt(match[1] || match[3] || 0);
  const minutes = parseInt(match[2] || match[4] || 0);
  
  return hours + (minutes / 60);
};

// Function to calculate and update hours for a specific driver
const updateDriverHours = async (driverEmail) => {
  try {
    // Calculate start and end of current week (Sunday to Saturday)
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7); // Saturday end

    // Get all timesheets for this driver in the current week
    const driverTimesheets = await Timesheet.find({
      driver: driverEmail,
      date: {
        $gte: startOfWeek.toISOString().split('T')[0],
        $lt: endOfWeek.toISOString().split('T')[0]
      }
    });

    console.log(`\n=== DEBUG: Calculating hours for driver ${driverEmail} ===`);
    console.log(`Week range: ${startOfWeek.toISOString().split('T')[0]} to ${endOfWeek.toISOString().split('T')[0]}`);
    console.log(`Found ${driverTimesheets.length} timesheets`);

    // Calculate total hours
    const totalHours = driverTimesheets.reduce((sum, timesheet) => {
      const calculatedHours = calculateHours(timesheet.startTime, timesheet.endTime);
      const storedTotalHours = timesheet.totalHours || 'N/A';
      const parsedStoredHours = parseStoredTotalHours(timesheet.totalHours);
      
      console.log(`Timesheet ${timesheet.date}: ${timesheet.startTime} - ${timesheet.endTime}`);
      console.log(`  Calculated hours (from startTime/endTime): ${calculatedHours.toFixed(2)}`);
      console.log(`  Stored totalHours field: ${storedTotalHours}`);
      console.log(`  Parsed stored hours: ${parsedStoredHours.toFixed(2)}`);
      console.log(`  Difference: ${Math.abs(calculatedHours - parsedStoredHours).toFixed(2)}`);
      
      return sum + (isNaN(calculatedHours) ? 0 : calculatedHours);
    }, 0);

    console.log(`Total weekly hours: ${totalHours.toFixed(2)}`);
    console.log(`=== END DEBUG ===\n`);

    // Update the driver's hoursThisWeek field
    await Driver.findOneAndUpdate(
      { email: driverEmail },
      { hoursThisWeek: totalHours }
    );

    return totalHours;
  } catch (error) {
    console.error(`Error updating hours for driver ${driverEmail}:`, error);
    return 0;
  }
};

// Function to update hours for all drivers
const updateAllDriversHours = async (req, res) => {
  try {
    const drivers = await Driver.find({}, 'email');
    
    for (const driver of drivers) {
      await updateDriverHours(driver.email);
    }
    
    console.log('Updated hours for all drivers');
    res.status(200).json({ message: 'Successfully updated hours for all drivers' });
  } catch (error) {
    console.error('Error updating all drivers hours:', error);
    res.status(500).json({ error: 'Failed to update drivers hours' });
  }
};

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
      plainPassword,
      hoursThisWeek: driver.hoursThisWeek || 0 // Include the calculated hours
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
  driverLogin,
  updateDriverHours,
  updateAllDriversHours
};
