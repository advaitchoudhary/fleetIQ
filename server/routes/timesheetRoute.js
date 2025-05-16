const express = require("express");
const {
  createTimesheet,
  getAllTimesheets,
  getTimesheetById,
  updateTimesheetById,
  deleteTimesheetById,
  updateTimesheetStatus,
  sendInvoiceEmail
} = require("../controller/timesheetController.js");
const upload = require("../middleware/upload.js");

const router = express.Router();

router.post("/", upload.array("attachments", 4), createTimesheet);
router.get("/", getAllTimesheets);
router.get("/:id", getTimesheetById);
router.put("/:id", updateTimesheetById);
router.put("/:id/status", updateTimesheetStatus);
router.delete("/:id", deleteTimesheetById);
router.post("/send-invoice-email", sendInvoiceEmail);

module.exports = router;
