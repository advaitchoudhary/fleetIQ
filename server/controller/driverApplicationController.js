const DriverApplication = require("../model/driverApplicationModel.js");
const Driver = require("../model/driverModel.js");
const bcrypt = require("bcryptjs");
const asyncHandler = require("express-async-handler");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const nodemailer = require("nodemailer");

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

// Send approval email to driver
const sendApprovalEmail = async (email, name, username, password) => {
  // Check if SMTP is configured
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("⚠️ SMTP not configured. Skipping approval email.");
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #4F46E5;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .content {
            background-color: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 8px 8px;
          }
          .credentials-box {
            background-color: #fff;
            border: 2px solid #4F46E5;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .credential-item {
            margin: 10px 0;
            padding: 10px;
            background-color: #f0f0f0;
            border-radius: 4px;
          }
          .label {
            font-weight: bold;
            color: #4F46E5;
          }
          .value {
            font-family: monospace;
            font-size: 16px;
            color: #333;
            margin-top: 5px;
          }
          .warning {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            color: #666;
            font-size: 12px;
          }
          .button {
            display: inline-block;
            background-color: #4F46E5;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎉 Driver Application Approved!</h1>
        </div>
        <div class="content">
          <p>Dear ${name},</p>
          
          <p>We are pleased to inform you that your driver application has been <strong>approved</strong>!</p>
          
          <p>You can now access the Premier Choice Employment platform using the following credentials:</p>
          
          <div class="credentials-box">
            <div class="credential-item">
              <div class="label">Username:</div>
              <div class="value">${username}</div>
            </div>
            <div class="credential-item">
              <div class="label">Password:</div>
              <div class="value">${password}</div>
            </div>
          </div>
          
          <div class="warning">
            <strong>⚠️ Important:</strong> For security reasons, please change your password immediately after logging in. You can do this by navigating to the "Change Password" section in your account settings.
          </div>
          
          <p>To log in, please visit the login page and use the credentials provided above.</p>
          
          <p>If you have any questions or need assistance, please don't hesitate to contact us.</p>
          
          <p>Welcome aboard!</p>
          
          <p>Best regards,<br>
          <strong>Premier Choice Employment Team</strong></p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </body>
      </html>
    `;

    const emailText = `
Dear ${name},

We are pleased to inform you that your driver application has been APPROVED!

You can now access the Premier Choice Employment platform using the following credentials:

Username: ${username}
Password: ${password}

IMPORTANT: For security reasons, please change your password immediately after logging in. You can do this by navigating to the "Change Password" section in your account settings.

To log in, please visit the login page and use the credentials provided above.

If you have any questions or need assistance, please don't hesitate to contact us.

Welcome aboard!

Best regards,
Premier Choice Employment Team
    `;

    const emailOptions = {
      from: `"Premier Choice Employment" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Your Driver Application Has Been Approved",
      text: emailText,
      html: emailHtml,
    };

    await transporter.sendMail(emailOptions);
    console.log(`✅ Approval email sent successfully to ${email}`);
  } catch (error) {
    console.error("Error sending approval email:", error);
    throw error;
  }
};

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
    application.username = username;
    application.password = defaultPassword; // Store plain password for reference
    if (adminNotes) {
      application.adminNotes = adminNotes;
    }
    await application.save();

    // Send approval email to driver
    try {
      await sendApprovalEmail(application.email, application.name, username, defaultPassword);
    } catch (emailError) {
      console.error("Failed to send approval email:", emailError);
      // Don't fail the approval if email fails, but log the error
    }

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



