const express = require("express");
const {
  createTimesheet,
  getAllTimesheets,
  getTimesheetById,
  updateTimesheetById,
  deleteTimesheetById,
  updateTimesheetStatus,
  clearInvoice,
  sendInvoiceEmail
} = require("../controller/timesheetController.js");
const upload = require("../middleware/upload.js");
const { protect, authorizeRoles } = require("../middleware/authMiddleware.js");
const { requireDriverModule } = require("../middleware/featureGate.js");

const router = express.Router();

// Bug fix: All routes now require authentication via `protect`.
// Invoice generation is part of driver management → available on all paid plans
// (Starter tier). requireDriverModule still requires an active subscription.
// send-invoice-email must be registered BEFORE /:id so it is not matched as a timesheet ID.
router.post("/send-invoice-email", protect, authorizeRoles("admin", "company_admin", "dispatcher"), requireDriverModule, sendInvoiceEmail);
// clear-invoice must also be registered BEFORE /:id so it is not matched as a timesheet ID.
router.put("/clear-invoice", protect, authorizeRoles("admin", "company_admin", "dispatcher"), requireDriverModule, clearInvoice);

router.post("/", protect, authorizeRoles("admin", "company_admin", "dispatcher", "driver"), (req, res, next) => {
  upload.array("attachments", 4)(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message });
    next();
  });
}, createTimesheet);
router.get("/", protect, authorizeRoles("admin", "company_admin", "dispatcher", "driver"), getAllTimesheets);
router.get("/:id", protect, authorizeRoles("admin", "company_admin", "dispatcher", "driver"), getTimesheetById);
router.put("/:id", protect, authorizeRoles("admin", "company_admin", "dispatcher"), updateTimesheetById);
router.put("/:id/status", protect, authorizeRoles("admin", "company_admin", "dispatcher"), updateTimesheetStatus);
router.delete("/:id", protect, authorizeRoles("admin", "company_admin", "dispatcher"), deleteTimesheetById);

module.exports = router;
