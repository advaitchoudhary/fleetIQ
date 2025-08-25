const mongoose = require('mongoose');
const Driver = require('../model/driverModel.js');
const Timesheet = require('../model/timesheetModel.js');
require('dotenv').config();

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

    // Calculate total hours
    const totalHours = driverTimesheets.reduce((sum, timesheet) => {
      const hours = calculateHours(timesheet.startTime, timesheet.endTime);
      return sum + (isNaN(hours) ? 0 : hours);
    }, 0);

    // Update the driver's hoursThisWeek field
    await Driver.findOneAndUpdate(
      { email: driverEmail },
      { hoursThisWeek: totalHours }
    );

    console.log(`Updated hours for ${driverEmail}: ${totalHours.toFixed(2)} hours`);
    return totalHours;
  } catch (error) {
    console.error(`Error updating hours for driver ${driverEmail}:`, error);
    return 0;
  }
};

// Function to update hours for all drivers
const updateAllDriversHours = async () => {
  try {
    const drivers = await Driver.find({}, 'email');
    console.log(`Found ${drivers.length} drivers to update`);
    
    for (const driver of drivers) {
      await updateDriverHours(driver.email);
    }
    
    console.log('Successfully updated hours for all drivers');
  } catch (error) {
    console.error('Error updating all drivers hours:', error);
  }
};

// Main execution function
const main = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Update all drivers
    await updateAllDriversHours();

    console.log('Script completed successfully');
  } catch (error) {
    console.error('Script failed:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};

// Run the script if called directly
if (require.main === module) {
  main();
}

module.exports = {
  updateDriverHours,
  updateAllDriversHours
};
