const Timesheet = require("../model/timesheetModel.js");
const Driver = require("../model/driverModel.js");
const User = require("../model/userModel.js");
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const { getOrgFilter } = require("../middleware/authMiddleware.js");
const { sendTimesheetApprovedEmail, sendInvoiceEmail: sendInvoiceEmailUtil } = require("../utils/emailService.js");

// Import the updateDriverHours function from driverController
const { updateDriverHours } = require("./driverController.js");

// Safe number parser
const parseNumber = (value) => {
  const parsed = Number(value);
  return isNaN(parsed) ? undefined : parsed;
};

// **1. Create a New Timesheet**
const createTimesheet = async (req, res) => {
  try {
    const attachmentPaths = req.files?.map?.(file => file.path) || [];

    // Parse extraWorkSheetDetails safely if present
    let extraWorkSheetDetails = {};
    try {
      if (req.body.extraWorkSheetDetails) {
        extraWorkSheetDetails = JSON.parse(req.body.extraWorkSheetDetails);
      }
    } catch (err) {
      console.warn("Invalid extraWorkSheetDetails JSON:", err);
    }

    // Parse storeDelay, roadDelay, otherDelay safely if present
    let storeDelay = {};
    try {
      if (req.body.storeDelay) {
        storeDelay = JSON.parse(req.body.storeDelay);
      }
    } catch (err) {
      console.warn("Invalid storeDelay JSON:", err);
    }

    let roadDelay = {};
    try {
      if (req.body.roadDelay) {
        roadDelay = JSON.parse(req.body.roadDelay);
      }
    } catch (err) {
      console.warn("Invalid roadDelay JSON:", err);
    }

    let otherDelay = {};
    try {
      if (req.body.otherDelay) {
        otherDelay = JSON.parse(req.body.otherDelay);
      }
    } catch (err) {
      console.warn("Invalid otherDelay JSON:", err);
    }

    // Normalize extraDelay to be always "yes" or "no" lowercase
    let extraDelay = req.body.extraDelay;
    if (typeof extraDelay === "string") {
      extraDelay = extraDelay.trim().toLowerCase() === "yes" ? "yes" : "no";
    } else {
      extraDelay = "no";
    }

    // Only store delay details if extraDelay is explicitly "yes"
    if (extraDelay !== "yes") {
      storeDelay = {};
      roadDelay = {};
      otherDelay = {};
    }

    const timesheetData = {
      driver: req.body.driver,
      date: req.body.date,
      startTime: req.body.startTime,
      endTime: req.body.endTime,
      customer: req.body.customer,
      category: req.body.category,
      tripNumber: req.body.tripNumber,
      loadID: req.body.loadID,
      gateOutTime: req.body.gateOutTime,
      gateInTime: req.body.gateInTime,
      plannedHours: req.body.plannedHours,
      plannedKM: req.body.plannedKM,
      startKM: parseNumber(req.body.startKM),
      endKM: parseNumber(req.body.endKM),
      totalHours: req.body.totalHours,
      comments: req.body.comments,
      attachments: attachmentPaths,
      extraWorkSheet: req.body.extraWorkSheet,
      extraDuration: extraWorkSheetDetails.duration,
      durationFrom: extraWorkSheetDetails.from,
      durationTo: extraWorkSheetDetails.to,
      // Bug fix: duplicate key — merge both sources; prefer the parsed JSON details,
      // fall back to the raw body field.
      extraWorkSheetComments: req.body.extraWorkSheetComments || extraWorkSheetDetails.comments || "",

      // Delay sections from frontend
      extraDelay,
      delayStoreDuration: storeDelay.duration,
      delayStoreFrom: storeDelay.from,
      delayStoreTo: storeDelay.to,
      delayStoreReason: storeDelay.reason,

      delayRoadDuration: roadDelay.duration,
      delayRoadFrom: roadDelay.from,
      delayRoadTo: roadDelay.to,
      delayRoadReason: roadDelay.reason,

      delayOtherDuration: otherDelay.duration,
      delayOtherFrom: otherDelay.from,
      delayOtherTo: otherDelay.to,
      delayOtherReason: otherDelay.reason,
    };

    // Create new timesheet (leave driverName blank initially)
    const newTimesheet = new Timesheet({
      ...timesheetData,
      organizationId: req.organizationId || null,
    });
    const savedTimesheet = await newTimesheet.save();

    // Update driver's hours for this week
    await updateDriverHours(req.body.driver);

    const emailToNameMap = await buildEmailToNameUsernameMap();
    res.status(201).json({
      message: "Timesheet created successfully",
      savedTimesheet: normalizeTimesheet(savedTimesheet, emailToNameMap)
    });
  } catch (error) {
    console.error("❌ Error saving Timesheet:", error.message);
    res.status(500).json({ errorMessage: error.message });
  }
};

// **2. Get All Timesheets (with Pagination and Filtering)**
const getAllTimesheets = async (req, res) => {
  try {
    const noPagination = req.query.noPagination === "true";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    // Filter parameters from query string
    const filter = req.query.filter;
    const selectedUser = req.query.user;
    const searchQuery = req.query.search;
    const rangeStart = req.query.rangeStart;
    const rangeEnd = req.query.rangeEnd;
    const selectedStatus = req.query.status;

    // Build query object for filtering — always scope to caller's org
    let query = { ...getOrgFilter(req) };

    // Driver role: JWT has no email field, so look up the driver record by id.
    if (req.user && req.user.role === "driver") {
      const driverDoc = await Driver.findById(req.user.id, "email").lean();
      query.driver = driverDoc?.email || "__no_match__";
    } else if (selectedUser && selectedUser !== "All") {
      // Admin/company_admin/dispatcher can filter by a specific driver
      query.driver = selectedUser;
    }
    
    // Status filter
    if (selectedStatus && selectedStatus !== "All") {
      query.status = selectedStatus.toLowerCase();
    }
    
    // Date filter
    if (filter && filter !== "All") {
      const today = new Date();
      
      if (filter === "Today") {
        const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format
        query.date = todayStr;
      } else if (filter === "This Week") {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const endOfWeek = new Date(today);
        endOfWeek.setDate(today.getDate() + (6 - today.getDay()));
        const startStr = startOfWeek.toISOString().split('T')[0];
        const endStr = endOfWeek.toISOString().split('T')[0];
        query.date = { $gte: startStr, $lte: endStr };
      } else if (filter === "This Month") {
        const yearMonth = today.toISOString().slice(0, 7); // YYYY-MM
        query.date = { $regex: `^${yearMonth}`, $options: 'i' };
      } else if (filter === "Custom" && rangeStart && rangeEnd) {
        query.date = { $gte: rangeStart, $lte: rangeEnd };
      }
    }
    
    // Search query - search across multiple fields
    if (searchQuery && searchQuery.trim()) {
      const searchRegex = { $regex: searchQuery, $options: 'i' };
      query.$or = [
        { driver: searchRegex },
        { customer: searchRegex },
        { category: searchRegex },
        { tripNumber: searchRegex },
        { loadID: searchRegex },
        { comments: searchRegex },
        { gateOutTime: searchRegex },
        { gateInTime: searchRegex },
        { plannedHours: searchRegex },
        { plannedKM: searchRegex },
        { totalHours: searchRegex }
      ];
    }

    // Bug fix: when noPagination=true (used by driver's MyTimesheet view),
    // return all matching documents without skip/limit.
    const skip = (page - 1) * limit;
    const [timesheets, total] = await Promise.all([
      noPagination
        ? Timesheet.find(query).sort({ date: -1 }).lean()
        : Timesheet.find(query).sort({ date: -1 }).skip(skip).limit(limit).lean(),
      Timesheet.countDocuments(query)
    ]);

    const emailToNameMap = await buildEmailToNameUsernameMap(req.organizationId);
    const enrichedTimesheets = timesheets.map(t => normalizeTimesheet(t, emailToNameMap));

    return res.status(200).json({
      data: enrichedTimesheets,
      totalPages: Math.ceil(total / limit),
      total,
      page
    });
  } catch (error) {
    console.error("Error fetching timesheets:", error);
    res.status(500).json({ error: "Failed to fetch timesheets" });
  }
};
const buildEmailToNameUsernameMap = async (organizationId = null) => {
  const orgFilter = organizationId ? { organizationId } : {};
  const [users, drivers] = await Promise.all([
    User.find(orgFilter, "email name"),
    Driver.find(orgFilter, "email name username")
  ]);

  const emailMap = {};

  users.forEach((user) => {
    emailMap[user.email] = { name: user.name, username: null };
  });

  drivers.forEach((driver) => {
    if (emailMap[driver.email]) {
      // If already exists from users, just update username
      emailMap[driver.email].username = driver.username || null;
    } else {
      // If only in drivers
      emailMap[driver.email] = {
        name: driver.name || null,
        username: driver.username || null
      };
    }
  });

  return emailMap;
};

// **3. Get Timesheet by ID**
const getTimesheetById = async (req, res) => {
  try {
    const id = req.params.id;
    const orgFilter = getOrgFilter(req);
    const timesheet = await Timesheet.findOne({ _id: id, ...orgFilter });
    if (!timesheet) {
      return res.status(404).json({ message: "Timesheet not found" });
    }
    const emailToNameMap = await buildEmailToNameUsernameMap(req.organizationId);
    res.status(200).json(normalizeTimesheet(timesheet, emailToNameMap));
  } catch (error) {
    res.status(500).json({ errorMessage: error.message });
  }
};

// **4. Update Timesheet by ID**
const updateTimesheetById = async (req, res) => {
  try {
    const id = req.params.id;
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: "No data provided for update" });
    }

    const orgFilter = getOrgFilter(req);
    // Get the original timesheet to get the driver email
    const originalTimesheet = await Timesheet.findOne({ _id: id, ...orgFilter });
    if (!originalTimesheet) {
      return res.status(404).json({ message: "Timesheet not found" });
    }

    const updatedTimesheet = await Timesheet.findOneAndUpdate({ _id: id, ...orgFilter }, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedTimesheet) {
      return res.status(404).json({ message: "Timesheet not found" });
    }

    // Update driver's hours for this week
    await updateDriverHours(originalTimesheet.driver);

    res.status(200).json({ message: "Timesheet updated successfully", updatedTimesheet });
  } catch (error) {
    res.status(500).json({ errorMessage: error.message });
  }
};

// **5. Delete Timesheet by ID**
const deleteTimesheetById = async (req, res) => {
  try {
    const id = req.params.id;
    const orgFilter = getOrgFilter(req);
    const deletedTimesheet = await Timesheet.findOneAndDelete({ _id: id, ...orgFilter });

    if (!deletedTimesheet) {
      return res.status(404).json({ message: "Timesheet not found" });
    }

    if (deletedTimesheet.attachments && deletedTimesheet.attachments.length > 0) {
      deletedTimesheet.attachments.forEach(filePath => {
        try {
          fs.unlinkSync(filePath);
        } catch (err) {
          console.error(`Failed to delete attachment at ${filePath}:`, err.message);
        }
      });
    }

    // Update driver's hours for this week after deletion
    await updateDriverHours(deletedTimesheet.driver);

    res.status(200).json({ message: "Timesheet deleted successfully" });
  } catch (error) {
    res.status(500).json({ errorMessage: error.message });
  }
};

// **6. Update Timesheet Status**
const updateTimesheetStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const orgFilter = getOrgFilter(req);
    const updatedTimesheet = await Timesheet.findOneAndUpdate(
      { _id: id, ...orgFilter },
      { status },
      { new: true, runValidators: true }
    );

    if (!updatedTimesheet) {
      return res.status(404).json({ message: "Timesheet not found" });
    }

    res.status(200).json({ message: `Timesheet ${status} successfully`, updatedTimesheet });

    // Create driver notification for status change
    if (updatedTimesheet.driver) {
      const Notification = require("../model/notificationModel");
      const dateStr = updatedTimesheet.date
        ? new Date(updatedTimesheet.date).toLocaleDateString("en-CA")
        : "your timesheet";
      Notification.create({
        organizationId: updatedTimesheet.organizationId,
        message: status === "approved"
          ? `Your timesheet for ${dateStr} has been approved.`
          : `Your timesheet for ${dateStr} has been rejected. Please contact your admin.`,
        email: updatedTimesheet.driver,
        field: "timesheet_status",
      }).catch(err => console.error("Timesheet notification failed:", err));
    }

    if (status === "approved" && updatedTimesheet.driver) {
      const driverDoc = await Driver.findOne({ email: updatedTimesheet.driver }, "name").lean();
      sendTimesheetApprovedEmail(
        updatedTimesheet.driver,
        driverDoc?.name,
        updatedTimesheet.date,
        updatedTimesheet.customer,
        updatedTimesheet.totalHours
      ).catch(err => console.error("Timesheet approval email failed:", err));
    }
  } catch (error) {
    res.status(500).json({ errorMessage: error.message });
  }
};

// **7. Fetch Invoice Details**
async function fetchInvoiceDetails(driverId) {
  const driver = await Driver.findById(driverId);
  if (!driver) throw new Error("Driver not found");

  const timesheets = await Timesheet.find({ driverId });

  let totalKM = 0;
  for (const sheet of timesheets) {
    const start = Number(sheet.startKM || 0);
    const end = Number(sheet.endKM || 0);
    if (!isNaN(start) && !isNaN(end)) {
      totalKM += end - start;
    }
  }

  const rate = driver.comboRate || 0;
  const amount = (totalKM * rate).toFixed(2);

  return {
    driverName: driver.name,
    businessName: driver.business_name,
    email: driver.email,
    address: driver.address,
    rate,
    totalKM,
    amount,
    invoiceDate: new Date().toLocaleDateString(),
  };
}

// **8. Create Invoice PDF**
function createInvoicePDF(data) {
  const doc = new PDFDocument();
  const fileName = `invoice_${data.driverName.replace(/\s+/g, "_")}_${Date.now()}.pdf`;
  const filePath = path.join(__dirname, fileName);
  doc.pipe(fs.createWriteStream(filePath));

  doc.fontSize(20).text("INVOICE", { align: "center" });
  doc.moveDown();

  doc.fontSize(12).text(`Date: ${data.invoiceDate}`);
  doc.text(`Driver: ${data.driverName}`);
  doc.text(`Business Name: ${data.businessName}`);
  doc.text(`Email: ${data.email}`);
  doc.text(`Address: ${data.address}`);
  doc.moveDown();

  doc.fontSize(14).text(`Rate: $${data.rate}/KM`);
  doc.text(`Total KM: ${data.totalKM}`);
  doc.text(`Total Amount: $${data.amount}`, { underline: true });
  doc.moveDown();

  doc.fontSize(10).text("Thank you for your service!", { align: "center" });

  doc.end();
  return filePath;
}

// **9. Send Invoice Email**
const sendInvoiceEmail = async (req, res) => {
  try {
    const { driverId, amount, invoicePdf } = req.body;
    const driver = await Driver.findById(driverId);
    if (!driver || !driver.email) {
      return res.status(404).json({ message: "Driver email not found." });
    }
    await sendInvoiceEmailUtil(driver.email, driver.name, amount || "N/A", invoicePdf);
    res.status(200).json({ message: "Invoice emailed successfully!" });
  } catch (error) {
    console.error("Failed to send invoice email:", error);
    res.status(500).json({ errorMessage: error.message });
  }
};

// **10. Normalize Timesheet Object**
function normalizeTimesheet(timesheet, driverInfoMap = null) {
  if (!timesheet) return null;
  const obj = timesheet.toObject?.() || timesheet;

  if (obj.driver && driverInfoMap) {
    const driverInfo = driverInfoMap[obj.driver] || {};
    const fullName = driverInfo.name || obj.driver;
    const username = driverInfo.username ? `(@${driverInfo.username})` : "";
    obj.driverName = `${fullName} ${username}`.trim();
  }

  return {
    ...obj,
    extraWorkSheetDetails: {
      duration: obj.extraDuration || "",
      from: obj.durationFrom || "",
      to: obj.durationTo || "",
      comments: obj.extraWorkSheetComments || ""
    },
    storeDelay: {
      duration: obj.delayStoreDuration || "",
      from: obj.delayStoreFrom || "",
      to: obj.delayStoreTo || "",
      reason: obj.delayStoreReason || ""
    },
    roadDelay: {
      duration: obj.delayRoadDuration || "",
      from: obj.delayRoadFrom || "",
      to: obj.delayRoadTo || "",
      reason: obj.delayRoadReason || ""
    },
    otherDelay: {
      duration: obj.delayOtherDuration || "",
      from: obj.delayOtherFrom || "",
      to: obj.delayOtherTo || "",
      reason: obj.delayOtherReason || ""
    }
  };
}

module.exports = {
  createTimesheet,
  getAllTimesheets,
  getTimesheetById,
  updateTimesheetById,
  deleteTimesheetById,
  updateTimesheetStatus,
  sendInvoiceEmail
};