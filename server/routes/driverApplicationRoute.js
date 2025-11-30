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

const router = express.Router();

// Public route - Submit driver application
router.post("/submit", uploadFields, submitDriverApplication);

// Admin routes - Get all applications
router.get(
  "/",
  protect,
  authorizeRoles("admin"),
  getAllDriverApplications
);

// Admin route - Get single application by ID
router.get(
  "/:id",
  protect,
  authorizeRoles("admin"),
  getDriverApplicationById
);

// Admin route - Approve application
router.put(
  "/:id/approve",
  protect,
  authorizeRoles("admin"),
  approveDriverApplication
);

// Admin route - Reject application
router.put(
  "/:id/reject",
  protect,
  authorizeRoles("admin"),
  rejectDriverApplication
);

module.exports = router;



