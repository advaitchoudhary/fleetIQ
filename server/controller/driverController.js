const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Driver = require("../model/driverModel.js");
const Organization = require("../model/organizationModel.js");
const Timesheet = require("../model/timesheetModel.js");
const asyncHandler = require("express-async-handler");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { getOrgFilter } = require("../middleware/authMiddleware.js");
const { sendDriverCredentialsEmail } = require("../utils/emailService.js");

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
    const orgFilter = getOrgFilter(req);
    const drivers = await Driver.find(orgFilter, 'email');

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

const create = async (req, res) => {
  try {
    const { email, username, password } = req.body;

    const orgFilter = getOrgFilter(req);
    const driverExist = await Driver.findOne({ email, ...orgFilter });
    if (driverExist) {
      res.status(400).json({ message: "Driver already exists" });
      return;
    }

    // Check username uniqueness globally (usernames must be unique across all orgs for login)
    if (username) {
      const usernameExist = await Driver.findOne({ username: username.trim() });
      if (usernameExist) {
        res.status(400).json({ message: "Username already exists" });
        return;
      }
    }

    // Hash the password before storing
    const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

    // Auto-generate driverId: ORG_SEQ_TIMESTAMP
    let driverId;
    if (req.organizationId) {
      const org = await Organization.findById(req.organizationId).lean();
      const orgPrefix = (org?.name || "DRV")
        .replace(/[^a-zA-Z0-9]/g, "")
        .slice(0, 4)
        .toUpperCase()
        .padEnd(4, "X");
      const driverCount = await Driver.countDocuments({ organizationId: req.organizationId });
      const seq = String(driverCount + 1).padStart(3, "0");
      driverId = `${orgPrefix}_${seq}_${Date.now()}`;
    }

    const newDriver = new Driver({
      ...req.body,
      organizationId: req.organizationId || null,
      driverId,
      password: hashedPassword,
      plainPassword: password,
    });
    const savedData = await newDriver.save();

    if (savedData.email && password) {
      sendDriverCredentialsEmail(savedData.email, savedData.name, savedData.username, password)
        .catch(err => console.error("Driver credentials email failed:", err));
    }

    const savedDataObj = savedData.toObject();
    const { password: _pw, plainPassword, ...driverWithoutPassword } = savedDataObj;
    res.status(201).json(driverWithoutPassword);
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    console.error("Driver create error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const getAllDrivers = asyncHandler(async (req, res) => {
  const orgFilter = getOrgFilter(req);
  const drivers = await Driver.find(orgFilter).lean(); // lean() for faster read

  const enhancedDrivers = drivers.map(driver => {
    // Exclude password and plainPassword from response
    const { password, plainPassword, ...driverWithoutPassword } = driver;
    
    // Filter out unwanted training "Adipisci laborum laboriosam"
    if (driverWithoutPassword.trainings && Array.isArray(driverWithoutPassword.trainings)) {
      driverWithoutPassword.trainings = driverWithoutPassword.trainings.filter((t) => {
        if (typeof t === 'string') {
          return t !== "Adipisci laborum laboriosam";
        }
        if (typeof t === 'object' && t !== null) {
          return t.name !== "Adipisci laborum laboriosam";
        }
        return true;
      });
    }
    
    return {
      ...driverWithoutPassword,
      hoursThisWeek: driver.hoursThisWeek || 0 // Include the calculated hours
    };
  });

  res.json(enhancedDrivers);
});

const getDriverById = asyncHandler(async (req, res) => {
  const orgFilter = getOrgFilter(req);
  const driver = await Driver.findOne({ _id: req.params.id, ...orgFilter })
    .populate("organizationId", "name")
    .lean();
  if (!driver) {
    res.status(404).json({ message: "Driver not found" });
    return;
  }
  // Exclude password and plainPassword from response
  const { password, plainPassword, ...driverWithoutPassword } = driver;
  
  // Filter out unwanted training "Adipisci laborum laboriosam"
  if (driverWithoutPassword.trainings && Array.isArray(driverWithoutPassword.trainings)) {
    driverWithoutPassword.trainings = driverWithoutPassword.trainings.filter((t) => {
      if (typeof t === 'string') {
        return t !== "Adipisci laborum laboriosam";
      }
      if (typeof t === 'object' && t !== null) {
        return t.name !== "Adipisci laborum laboriosam";
      }
      return true;
    });
  }
  res.json(driverWithoutPassword);
});

const driverLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    const driver = await Driver.findOne({ username }).populate("organizationId", "name");
    if (!driver) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const isMatch = await bcrypt.compare(password, driver.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const token = jwt.sign(
      { id: driver._id, role: "driver", organizationId: driver.organizationId?._id || null },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      token,
      driver: {
        id: driver._id,
        username: driver.username,
        name: driver.name,
        email: driver.email,
        role: "driver",
        driverId: driver.driverId || null,
        organizationId: driver.organizationId?._id || driver.organizationId || null,
        orgName: driver.organizationId?.name || null,
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
    if (decoded.role === "admin" || decoded.role === "company_admin") {
      // Admin / company_admin: must provide driverId to change a driver's password
      if (!driverId) return res.status(400).json({ error: "driverId is required when changing a driver's password" });
      driverToUpdate = await Driver.findById(driverId);
    } else if (decoded.role === "driver") {
      // Driver: change own password
      driverToUpdate = await Driver.findById(decoded.id);
    } else {
      return res.status(403).json({ error: "Access denied" });
    }

    if (!driverToUpdate) return res.status(404).json({ error: "Driver not found" });

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: "New password must be at least 8 characters" });
    }

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
  const orgFilter = getOrgFilter(req);
  // Strip password fields — password changes must go through /change-password
  const { password, plainPassword, ...safeBody } = req.body;
  try {
    const updatedDriver = await Driver.findOneAndUpdate(
      { _id: req.params.id, ...orgFilter },
      safeBody,
      { new: true, runValidators: true }
    ).lean();

    if (!updatedDriver) {
      res.status(404).json({ message: "Driver not found" });
      return;
    }
    const { password: _pw, plainPassword: _pp, ...driverWithoutPassword } = updatedDriver;
    res.json(driverWithoutPassword);
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    throw err;
  }
});

const deleteDriverById = asyncHandler(async (req, res) => {
  const orgFilter = getOrgFilter(req);
  const driver = await Driver.findOneAndDelete({ _id: req.params.id, ...orgFilter });
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

// Configure multer for required onboarding forms
const ONBOARDING_FORMS_DIR = "uploads/required-onboarding-forms/";
if (!fs.existsSync(ONBOARDING_FORMS_DIR)) {
  fs.mkdirSync(ONBOARDING_FORMS_DIR, { recursive: true });
}

// Configure multer for training proof documents
const TRAINING_PROOFS_DIR = "uploads/training-proofs/";
if (!fs.existsSync(TRAINING_PROOFS_DIR)) {
  fs.mkdirSync(TRAINING_PROOFS_DIR, { recursive: true });
}

// Configure multer for compliance documents
const COMPLIANCE_DOCS_DIR = "uploads/compliance-documents/";
if (!fs.existsSync(COMPLIANCE_DOCS_DIR)) {
  fs.mkdirSync(COMPLIANCE_DOCS_DIR, { recursive: true });
}

const onboardingFormsStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, ONBOARDING_FORMS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const onboardingFormsFileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  
  // Log the received MIME type for debugging
  console.log("Received file MIME type:", file.mimetype);
  console.log("File original name:", file.originalname);
  
  // Normalize MIME type (remove extra spaces, convert to lowercase for comparison)
  const normalizedMimeType = file.mimetype?.toLowerCase().trim();
  
  if (allowedTypes.some(type => type.toLowerCase() === normalizedMimeType)) {
    cb(null, true);
  } else {
    const error = new Error(`Invalid file type: ${file.mimetype || 'unknown'}. Only JPEG, PNG, PDF, and DOC files are allowed`);
    cb(error, false);
  }
};

const uploadOnboardingForm = multer({
  storage: onboardingFormsStorage,
  fileFilter: onboardingFormsFileFilter,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB max per file
});

const trainingProofsStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, TRAINING_PROOFS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const trainingProofsFileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, PNG, PDF, and DOC files are allowed"), false);
  }
};

const uploadTrainingProof = multer({
  storage: trainingProofsStorage,
  fileFilter: trainingProofsFileFilter,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB max per file
});

// Upload or update required onboarding form
const uploadRequiredForm = asyncHandler(async (req, res) => {
  try {
    const { driverId, formType } = req.body; // formType: 'agencySignOff', 'driverDeliveryExpectations', 'cellPhonePolicy', 'storeSurvey1', 'tobaccoAndLCPValidation', 'driverSop'
    
    if (!driverId || !formType) {
      return res.status(400).json({ message: "Driver ID and form type are required" });
    }

    const allowedFormTypes = ['agencySignOff', 'driverDeliveryExpectations', 'cellPhonePolicy', 'storeSurvey1', 'tobaccoAndLCPValidation', 'driverSop'];
    if (!allowedFormTypes.includes(formType)) {
      return res.status(400).json({ message: "Invalid form type" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "File is required. Please ensure the file is a valid PDF, DOC, DOCX, JPEG, JPG, or PNG file." });
    }

    const driver = await Driver.findById(driverId);
    if (!driver) {
      // Delete uploaded file if driver not found
      if (req.file.path) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ message: "Driver not found" });
    }

    // Authorization check: drivers can only update their own forms, admins can update any
    if (req.user && req.user.role === 'driver') {
      // For drivers, check if they're updating their own form
      // We need to get the driver's email from the token's id
      const driverFromToken = await Driver.findById(req.user.id);
      if (!driverFromToken || driverFromToken.email !== driver.email) {
        // Delete uploaded file if unauthorized
        if (req.file.path) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(403).json({ message: "You can only update your own forms" });
      }
    }

    // Delete old file if it exists
    const oldFilePath = driver.requiredOnboardingForms?.[formType];
    if (oldFilePath && fs.existsSync(oldFilePath)) {
      fs.unlinkSync(oldFilePath);
    }

    // Update driver with new file path
    if (!driver.requiredOnboardingForms) {
      driver.requiredOnboardingForms = {};
    }
    driver.requiredOnboardingForms[formType] = req.file.path;
    await driver.save();

    const updatedDriver = await Driver.findById(driverId).lean();
    const { password, plainPassword, ...driverWithoutPassword } = updatedDriver;
    
    res.status(200).json({
      message: "Form uploaded successfully",
      driver: driverWithoutPassword
    });
  } catch (error) {
    // Delete uploaded file on error
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error("Error uploading required form:", error);
    res.status(500).json({ message: "Failed to upload form", error: error.message });
  }
});

// Upload or update training proof document
const uploadTrainingProofDocument = asyncHandler(async (req, res) => {
  try {
    const { driverId, trainingName } = req.body;
    
    if (!driverId || !trainingName) {
      return res.status(400).json({ message: "Driver ID and training name are required" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "File is required" });
    }

    // Get driver as plain object to handle migration
    const driver = await Driver.findById(driverId).lean();
    if (!driver) {
      // Delete uploaded file if driver not found
      if (req.file.path) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ message: "Driver not found" });
    }

    // Authorization check: drivers can only update their own trainings, admins can update any
    if (req.user && req.user.role === 'driver') {
      const driverFromToken = await Driver.findById(req.user.id).lean();
      if (!driverFromToken || driverFromToken.email !== driver.email) {
        // Delete uploaded file if unauthorized
        if (req.file.path) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(403).json({ message: "You can only update your own trainings" });
      }
    }

    // Migrate old string format to new object format if needed
    let migratedTrainings = [];
    if (driver.trainings && Array.isArray(driver.trainings) && driver.trainings.length > 0) {
      migratedTrainings = driver.trainings.map((t) => {
        // If it's a string (old format), convert to object
        if (typeof t === 'string') {
          return {
            name: t,
            proofDocument: null
          };
        }
        // If it's an object, ensure it has the right structure
        if (typeof t === 'object' && t !== null) {
          return {
            name: t.name || String(t), // Fallback to string conversion if name is missing
            proofDocument: t.proofDocument || null
          };
        }
        return null;
      }).filter(t => {
        // Remove any null entries, entries without name, and the unwanted training
        return t !== null && t.name && t.name !== "Adipisci laborum laboriosam";
      });
    }

    // Check if training already exists
    const existingTrainingIndex = migratedTrainings.findIndex(
      (t) => t && t.name === trainingName
    );

    // Delete old file if it exists
    if (existingTrainingIndex !== -1) {
      const existingTraining = migratedTrainings[existingTrainingIndex];
      if (existingTraining.proofDocument) {
        const oldFilePath = existingTraining.proofDocument;
        if (oldFilePath && fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
      // Update existing training
      migratedTrainings[existingTrainingIndex] = {
        name: trainingName,
        proofDocument: req.file.path
      };
    } else {
      // Add new training
      migratedTrainings.push({
        name: trainingName,
        proofDocument: req.file.path
      });
    }

    // Update driver with migrated and updated trainings
    await Driver.findByIdAndUpdate(
      driverId,
      { trainings: migratedTrainings },
      { new: true, runValidators: true }
    );

    const updatedDriver = await Driver.findById(driverId).lean();
    const { password, plainPassword, ...driverWithoutPassword } = updatedDriver;
    
    res.status(200).json({
      message: "Training proof uploaded successfully",
      driver: driverWithoutPassword
    });
  } catch (error) {
    // Delete uploaded file on error
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error("Error uploading training proof:", error);
    res.status(500).json({ message: "Failed to upload training proof", error: error.message });
  }
});

const uploadComplianceDoc = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, COMPLIANCE_DOCS_DIR),
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  }),
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "application/pdf",
      "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error("Only JPEG, PNG, PDF, and DOC files are allowed"), false);
  },
  limits: { fileSize: 15 * 1024 * 1024 },
});

// POST /api/drivers/upload-compliance-document
const uploadComplianceDocument = asyncHandler(async (req, res) => {
  try {
    const { driverId, documentName } = req.body;
    if (!driverId || !documentName) {
      return res.status(400).json({ message: "Driver ID and document name are required" });
    }
    if (!req.file) {
      return res.status(400).json({ message: "File is required" });
    }

    const driver = await Driver.findById(driverId).lean();
    if (!driver) {
      if (req.file.path) fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: "Driver not found" });
    }

    // Authorization: drivers can only update their own documents
    if (req.user && req.user.role === "driver") {
      const driverFromToken = await Driver.findById(req.user.id).lean();
      if (!driverFromToken || driverFromToken.email !== driver.email) {
        if (req.file.path) fs.unlinkSync(req.file.path);
        return res.status(403).json({ message: "You can only update your own documents" });
      }
    }

    const docs = (driver.complianceDocuments || []).map((d) => ({ name: d.name, document: d.document || null }));
    const existingIdx = docs.findIndex((d) => d.name === documentName);

    if (existingIdx !== -1) {
      // Delete old file
      const oldPath = docs[existingIdx].document;
      if (oldPath && fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      docs[existingIdx] = { name: documentName, document: req.file.path };
    } else {
      docs.push({ name: documentName, document: req.file.path });
    }

    await Driver.findByIdAndUpdate(driverId, { complianceDocuments: docs }, { new: true });
    const updated = await Driver.findById(driverId).lean();
    const { password, plainPassword, ...driverWithoutPassword } = updated;
    res.status(200).json({ message: "Compliance document uploaded successfully", driver: driverWithoutPassword });
  } catch (error) {
    if (req.file && req.file.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    console.error("Error uploading compliance document:", error);
    res.status(500).json({ message: "Failed to upload compliance document", error: error.message });
  }
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
  updateAllDriversHours,
  uploadRequiredForm,
  uploadOnboardingForm,
  uploadTrainingProofDocument,
  uploadTrainingProof,
  uploadComplianceDocument,
  uploadComplianceDoc,
};
