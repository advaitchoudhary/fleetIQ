const express = require("express");
const {
  submitDriverApplication,
  getAllDriverApplications,
  getDriverApplicationById,
  approveDriverApplication,
  rejectDriverApplication,
  uploadFields,
} = require("../controller/driverApplicationController.js");
const { protect, authorizeRoles } = require("../middleware/authMiddleware.js");
const { requireDriverModule } = require("../middleware/featureGate.js");

const router = express.Router();

// Public route - Submit driver application (no auth/feature gate: applicants are not logged in)
router.post(
  "/submit",
  (req, res, next) => {
    uploadFields(req, res, (err) => {
      if (err) {
        return res.status(400).json({ message: err.message || "File upload error" });
      }
      next();
    });
  },
  submitDriverApplication
);

// Admin routes - Get all applications
router.get(
  "/",
  protect,
  authorizeRoles("admin", "company_admin"),
  requireDriverModule,
  getAllDriverApplications
);

// Admin route - Get single application by ID
router.get(
  "/:id",
  protect,
  authorizeRoles("admin", "company_admin"),
  requireDriverModule,
  getDriverApplicationById
);

// Admin route - Approve application
router.put(
  "/:id/approve",
  protect,
  authorizeRoles("admin", "company_admin"),
  requireDriverModule,
  approveDriverApplication
);

// Admin route - Reject application
router.put(
  "/:id/reject",
  protect,
  authorizeRoles("admin", "company_admin"),
  requireDriverModule,
  rejectDriverApplication
);

module.exports = router;



