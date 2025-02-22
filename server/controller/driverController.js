import Driver from "../model/driverModel.js";

export const create = async (req, res) => {
  try {
    const newDriver = new Driver(req.body);
    const { email } = newDriver;

    const driverExist = await Driver.findOne({ email });
    if (driverExist) {
      return res.status(400).json({ message: "Driver already exists" });
    }
    const savedData = await newDriver.save();
    res.status(200).json(savedData);
  } catch (error) {
    res.status(500).json({ errorMessage: error.message });
  }
};

export const getAllDrivers = async (req, res) => {
  try {
    const driverData = await Driver.find();
    if (!driverData || driverData.length === 0) {
      return res.status(404).json({ message: "Driver data not found" });
    }
    res.status(200).json(driverData);
  } catch (error) {
    res.status(500).json({ errorMessage: error.message });
  }
};

export const getDriverById = async (req, res) => {
  try {
    const id = req.params.id;
    const driverExist = await Driver.findById(id);

    if (!driverExist) {
      return res.status(404).json({ message: "Driver data not found" });
    }
    res.status(200).json(driverExist);
  } catch (error) {
    res.status(500).json({ errorMessage: error.message });
  }
};

export const updateDriverById = async (req, res) => {
    try {
      const id = req.params.id;
  
      // Validate if req.body is not empty
      if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ message: "No data provided for update" });
      }
  
      const driverExist = await Driver.findById(id);
  
      if (!driverExist) {
        return res.status(404).json({ message: "Driver data not found" });
      }
  
      // Update driver data
      const updatedData = await Driver.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true, // Ensures the updated data follows the schema rules
      });
  
      res.status(200).json(updatedData);
    } catch (error) {
      res.status(500).json({ errorMessage: error.message });
    }
  };

  export const deleteDriverById = async (req, res) => {
    try {
      const id = req.params.id;
  
      // Check if driver exists
      const driverExist = await Driver.findById(id);
      if (!driverExist) {
        return res.status(404).json({ message: "Driver not found" });
      }
  
      // Delete the driver
      await Driver.findByIdAndDelete(id);
  
      res.status(200).json({ message: "Driver deleted successfully" });
    } catch (error) {
      res.status(500).json({ errorMessage: error.message });
    }
  };
