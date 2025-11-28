const DriverApplication = require("../model/driverApplicationModel.js");
const Driver = require("../model/driverModel.js");
const bcrypt = require("bcryptjs");
const asyncHandler = require("express-async-handler");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configure multer for multiple file uploads
const UPLOADS_DIR = "uploads/driver-applications/";
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter for images and documents
const fileFilter = (req, file, cb) => {
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

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB max per file
});

// Middleware to handle multiple files
const uploadFields = upload.fields([
  { name: "licenseFront", maxCount: 1 },
  { name: "licenseBack", maxCount: 1 },
  { name: "applicationForm", maxCount: 1 },
  { name: "pceConsentForm", maxCount: 1 },
  { name: "cvor", maxCount: 1 },
  { name: "driversAbstract", maxCount: 1 },
]);

// Submit driver application
const submitDriverApplication = asyncHandler(async (req, res) => {
  try {
    // Get file paths from multer
    const licenseFront = req.files?.licenseFront?.[0]?.path;
    const licenseBack = req.files?.licenseBack?.[0]?.path;
    const applicationForm = req.files?.applicationForm?.[0]?.path;
    const pceConsentForm = req.files?.pceConsentForm?.[0]?.path;
    const cvor = req.files?.cvor?.[0]?.path;
    const driversAbstract = req.files?.driversAbstract?.[0]?.path;

    // Validate required fields
    const {
      name,
      email,
      phone,
      address,
      sinNo,
      licenseClass,
      licenseExpiryDate,
      truckingExperienceYears,
      truckingExperienceMonths,
      preferredStartLocation,
    } = req.body;

    if (!name || !email || !phone || !address || !sinNo || !licenseClass || !licenseExpiryDate) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!licenseFront || !licenseBack) {
      return res.status(400).json({ message: "License front and back images are required" });
    }

    if (!applicationForm) {
      return res.status(400).json({ message: "Application form is required" });
    }

    if (!pceConsentForm) {
      return res.status(400).json({ message: "PCE Consent Form is required" });
    }

    // Create new driver application
    const driverApplication = new DriverApplication({
      name,
      email,
      phone,
      address,
      sinNo,
      licenseClass,
      licenseExpiryDate: new Date(licenseExpiryDate),
      licenseFront,
      licenseBack,
      applicationForm,
      pceConsentForm,
      truckingExperienceYears: parseInt(truckingExperienceYears) || 0,
      truckingExperienceMonths: parseInt(truckingExperienceMonths) || 0,
      cvor: cvor || undefined,
      driversAbstract: driversAbstract || undefined,
      preferredStartLocation: preferredStartLocation || undefined,
      status: "Pending",
    });

    const savedApplication = await driverApplication.save();

    res.status(201).json({
      message: "Driver application submitted successfully",
      application: savedApplication,
    });
  } catch (error) {
    console.error("Error submitting driver application:", error);
    res.status(500).json({ message: "Failed to submit application", error: error.message });
  }
});

// Get all driver applications (Admin only)
const getAllDriverApplications = asyncHandler(async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    
    const applications = await DriverApplication.find(query).sort({ createdAt: -1 });
    res.status(200).json(applications);
  } catch (error) {
    console.error("Error fetching driver applications:", error);
    res.status(500).json({ message: "Failed to fetch applications", error: error.message });
  }
});

// Get single driver application by ID
const getDriverApplicationById = asyncHandler(async (req, res) => {
  try {
    const application = await DriverApplication.findById(req.params.id);
    
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }
    
    res.status(200).json(application);
  } catch (error) {
    console.error("Error fetching driver application:", error);
    res.status(500).json({ message: "Failed to fetch application", error: error.message });
  }
});

// Approve driver application (Admin only)
const approveDriverApplication = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;

    const application = await DriverApplication.findById(id);

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (application.status !== "Pending") {
      return res.status(400).json({ message: "Application is not in pending status" });
    }

    // Check if driver with this email already exists
    const existingDriver = await Driver.findOne({ email: application.email });
    if (existingDriver) {
      return res.status(400).json({ message: "Driver with this email already exists" });
    }

    // Generate username from email (before @ symbol)
    const username = application.email.split("@")[0];

    // Generate a default password (you might want to send this via email)
    const defaultPassword = `Driver${Date.now()}`;
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // Create driver from application
    const newDriver = new Driver({
      name: application.name,
      email: application.email,
      contact: application.phone,
      address: application.address,
      sinNo: application.sinNo,
      licence: application.licenseClass,
      licence_expiry_date: application.licenseExpiryDate,
      username: username,
      password: hashedPassword,
      plainPassword: defaultPassword,
      workStatus: "Active",
      status: "Active",
      hoursThisWeek: 0,
    });

    await newDriver.save();

    // Update application status
    application.status = "Approved";
    if (adminNotes) {
      application.adminNotes = adminNotes;
    }
    await application.save();

    res.status(200).json({
      message: "Application approved and driver created successfully",
      driver: {
        id: newDriver._id,
        username: username,
        password: defaultPassword, // Return password for admin to share with driver
      },
      application: application,
    });
  } catch (error) {
    console.error("Error approving driver application:", error);
    res.status(500).json({ message: "Failed to approve application", error: error.message });
  }
});

// Reject driver application (Admin only)
const rejectDriverApplication = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;

    const application = await DriverApplication.findById(id);

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (application.status !== "Pending") {
      return res.status(400).json({ message: "Application is not in pending status" });
    }

    // Update application status
    application.status = "Rejected";
    if (adminNotes) {
      application.adminNotes = adminNotes;
    }
    await application.save();

    res.status(200).json({
      message: "Application rejected successfully",
      application: application,
    });
  } catch (error) {
    console.error("Error rejecting driver application:", error);
    res.status(500).json({ message: "Failed to reject application", error: error.message });
  }
});

module.exports = {
  submitDriverApplication,
  getAllDriverApplications,
  getDriverApplicationById,
  approveDriverApplication,
  rejectDriverApplication,
  uploadFields,
};



