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
const { protect, authorizeRoles } = require("../middleware/authMiddleware.js");

const router = express.Router();

// Bug fix: All routes now require authentication via `protect`.
// send-invoice-email must be registered BEFORE /:id so it is not matched as a timesheet ID.
router.post("/send-invoice-email", protect, authorizeRoles("admin", "company_admin", "dispatcher"), sendInvoiceEmail);

router.post("/", protect, authorizeRoles("admin", "company_admin", "dispatcher", "driver"), upload.array("attachments", 4), createTimesheet);
router.get("/", protect, authorizeRoles("admin", "company_admin", "dispatcher", "driver"), getAllTimesheets);
router.get("/:id", protect, authorizeRoles("admin", "company_admin", "dispatcher", "driver"), getTimesheetById);
router.put("/:id", protect, authorizeRoles("admin", "company_admin", "dispatcher"), updateTimesheetById);
router.put("/:id/status", protect, authorizeRoles("admin", "company_admin", "dispatcher"), updateTimesheetStatus);
router.delete("/:id", protect, authorizeRoles("admin", "company_admin", "dispatcher"), deleteTimesheetById);

module.exports = router;
