const express = require("express");
const {
  registerOrganization,
  getOrganizationProfile,
  updateOrganizationProfile,
  getAllOrganizations,
  getMandatoryTrainings,
  updateMandatoryTrainings,
  getMandatoryDocuments,
  updateMandatoryDocuments,
  getTimesheetCategories,
  updateTimesheetCategories,
} = require("../controller/organizationController.js");
const { protect, authorizeRoles } = require("../middleware/authMiddleware.js");

const router = express.Router();

// Public — company sign-up
router.post("/register", registerOrganization);

// Any org member can view their own org profile
router.get(
  "/profile",
  protect,
  authorizeRoles("admin", "company_admin", "dispatcher", "driver"),
  getOrganizationProfile
);
router.put(
  "/profile",
  protect,
  authorizeRoles("admin", "company_admin"),
  updateOrganizationProfile
);

// Platform admin — list all organizations
router.get(
  "/",
  protect,
  authorizeRoles("admin"),
  getAllOrganizations
);

// Mandatory trainings — all org members can read, only admins can write
router.get(
  "/mandatory-trainings",
  protect,
  authorizeRoles("admin", "company_admin", "dispatcher", "driver"),
  getMandatoryTrainings
);
router.put(
  "/mandatory-trainings",
  protect,
  authorizeRoles("admin", "company_admin"),
  updateMandatoryTrainings
);

// Mandatory compliance documents — all org members can read, only admins can write
router.get(
  "/mandatory-documents",
  protect,
  authorizeRoles("admin", "company_admin", "dispatcher", "driver"),
  getMandatoryDocuments
);
router.put(
  "/mandatory-documents",
  protect,
  authorizeRoles("admin", "company_admin"),
  updateMandatoryDocuments
);

// Timesheet categories — drivers can read, only admins can write
router.get(
  "/timesheet-categories",
  protect,
  authorizeRoles("admin", "company_admin", "dispatcher", "driver"),
  getTimesheetCategories
);
router.put(
  "/timesheet-categories",
  protect,
  authorizeRoles("admin", "company_admin"),
  updateTimesheetCategories
);

module.exports = router;
