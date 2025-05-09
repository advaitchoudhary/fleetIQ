import Timesheet from "../model/timesheetModel.js";
import Driver from "../model/driverModel.js";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Setup for ES modules to use __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Safe number parser
const parseNumber = (value) => {
  const parsed = Number(value);
  return isNaN(parsed) ? undefined : parsed;
};

// **1. Create a New Timesheet**
export const createTimesheet = async (req, res) => {
  try {
    console.log("Incoming Timesheet Body:", req.body);
    console.log("Incoming Timesheet Files:", req.files);
    console.log("✅ req.files is:", req.files);
    
    const attachmentPaths = req.files?.map?.(file => file.path) || [];

    const timesheetData = {
      driver: req.body.driver,
      date: req.body.date,
      startTime: req.body.startTime,
      endTime: req.body.endTime,
      customer: req.body.customer,
      startDate: req.body.startDate,
      category: req.body.category,
      tripNumber: req.body.tripNumber,
      loadID: req.body.loadID,
      preStartTime: req.body.preStartTime,
      gateOutTime: req.body.gateOutTime,
      ewStartTimeMorning: req.body.ewStartTimeMorning,
      ewEndTimeMorning: req.body.ewEndTimeMorning,
      ewReasonMorning: req.body.ewReasonMorning,
      gateInTime: req.body.gateInTime,
      postEndTime: req.body.postEndTime,
      endDate: req.body.endDate,
      ewStartTimeEvening: req.body.ewStartTimeEvening,
      ewEndTimeEvening: req.body.ewEndTimeEvening,
      ewReasonEvening: req.body.ewReasonEvening,
      plannedHours: req.body.plannedHours,
      totalStops: req.body.totalStops,
      plannedKM: req.body.plannedKM,
      startKM: parseNumber(req.body.startKM),
      endKM: parseNumber(req.body.endKM),
      comments: req.body.comments,
      attachments: attachmentPaths,
    };

    console.log("✅ Timesheet Data ready for saving:", timesheetData);

    const newTimesheet = new Timesheet(timesheetData);
    const savedTimesheet = await newTimesheet.save();
    res.status(201).json({ message: "Timesheet created successfully", savedTimesheet });
  } catch (error) {
    console.error("❌ Error saving Timesheet:", error.message);
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

// **6. Update Timesheet Status**
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
export const sendInvoiceEmail = async (req, res) => {
  try {
    const { driverId } = req.body;
    const driver = await Driver.findById(driverId);
    if (!driver || !driver.email) {
      return res.status(404).json({ message: "Driver email not found." });
    }

  // Decode and write the already-generated PDF from frontend
  const pdfBuffer = Buffer.from(req.body.invoicePdf, 'base64');
  const fileName = `invoice_${Date.now()}.pdf`;
  const filePath = path.join(__dirname, fileName);
  fs.writeFileSync(filePath, pdfBuffer);

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const emailOptions = {
      from: '"Premier Choice Employment" <admin@premierchoicemployment.ca>',
      to: driver.email,
      subject: "Your Invoice",
      text: `Hello ${driver.name},\n\nPlease find attached your invoice totaling $${invoiceDetails.amount}.\n\nBest regards,\nPremier Choice Employment`,
      attachments: [
        {
          filename: "invoice.pdf",
          path: invoiceFilePath,
        },
      ],
    };

    await transporter.sendMail(emailOptions);
    fs.unlinkSync(invoiceFilePath);

    res.status(200).json({ message: "Invoice emailed successfully!" });
  } catch (error) {
    console.error("Failed to send invoice email:", error);
    res.status(500).json({ errorMessage: error.message });
  }
};