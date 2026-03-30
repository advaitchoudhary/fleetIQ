const express = require("express");
const {
  registerOrganization,
  getOrganizationProfile,
  updateOrganizationProfile,
  getAllOrganizations,
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

module.exports = router;
