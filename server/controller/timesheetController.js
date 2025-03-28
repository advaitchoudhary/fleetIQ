import Timesheet from "../model/timesheetModel.js";

// **1. Create a New Timesheet**
export const createTimesheet = async (req, res) => {
  try {
    // Safe parser for number fields
    const parseNumber = (value) => {
      const parsed = Number(value);
      return isNaN(parsed) ? undefined : parsed;
    };
    console.log("Incoming Timesheet:", req.body);
    const timesheetData = {
      ...req.body,
      startKM: parseNumber(req.body.startKM),
      endKM: parseNumber(req.body.endKM),
    };

    const newTimesheet = new Timesheet(timesheetData);
    const savedTimesheet = await newTimesheet.save();
    res.status(201).json({ message: "Timesheet created successfully", savedTimesheet });
  } catch (error) {
    res.status(500).json({ errorMessage: error.message });
  }
};

// **2. Get All Timesheets**
export const getAllTimesheets = async (req, res) => {
  try {
    const timesheets = await Timesheet.find();
    if (!timesheets || timesheets.length === 0) {
      return res.status(404).json({ message: "No timesheets found" });
    }
    res.status(200).json(timesheets);
  } catch (error) {
    res.status(500).json({ errorMessage: error.message });
  }
};

// **3. Get Timesheet by ID**
export const getTimesheetById = async (req, res) => {
  try {
    const id = req.params.id;
    const timesheet = await Timesheet.findById(id);
    if (!timesheet) {
      return res.status(404).json({ message: "Timesheet not found" });
    }
    res.status(200).json(timesheet);
  } catch (error) {
    res.status(500).json({ errorMessage: error.message });
  }
};

// **4. Update Timesheet by ID**
export const updateTimesheetById = async (req, res) => {
  try {
    const id = req.params.id;
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: "No data provided for update" });
    }

    const updatedTimesheet = await Timesheet.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedTimesheet) {
      return res.status(404).json({ message: "Timesheet not found" });
    }

    res.status(200).json({ message: "Timesheet updated successfully", updatedTimesheet });
  } catch (error) {
    res.status(500).json({ errorMessage: error.message });
  }
};

// **5. Delete Timesheet by ID**
export const deleteTimesheetById = async (req, res) => {
  try {
    const id = req.params.id;
    const deletedTimesheet = await Timesheet.findByIdAndDelete(id);

    if (!deletedTimesheet) {
      return res.status(404).json({ message: "Timesheet not found" });
    }

    res.status(200).json({ message: "Timesheet deleted successfully" });
  } catch (error) {
    res.status(500).json({ errorMessage: error.message });
  }
};

// **Update Timesheet Status**
export const updateTimesheetStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const updatedTimesheet = await Timesheet.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!updatedTimesheet) {
      return res.status(404).json({ message: "Timesheet not found" });
    }

    res.status(200).json({ message: `Timesheet ${status} successfully`, updatedTimesheet });
  } catch (error) {
    res.status(500).json({ errorMessage: error.message });
  }
};