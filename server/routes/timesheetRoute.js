import express from "express";
import {
  createTimesheet,
  getAllTimesheets,
  getTimesheetById,
  updateTimesheetById,
  deleteTimesheetById,
  updateTimesheetStatus,
  sendInvoiceEmail
} from "../controller/timesheetController.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.post("/timesheet", upload.array("attachments", 4), createTimesheet);
router.get("/timesheets", getAllTimesheets);
router.get("/timesheet/:id", getTimesheetById);
router.put("/update/timesheet/:id", updateTimesheetById);
router.put("/timesheet/:id/status", updateTimesheetStatus);
router.delete("/delete/timesheet/:id", deleteTimesheetById);
router.post('/send-invoice-email', sendInvoiceEmail);

export default router;