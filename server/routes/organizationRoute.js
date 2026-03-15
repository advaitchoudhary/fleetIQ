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

// Company admin — view/update their own org
router.get(
  "/profile",
  protect,
  authorizeRoles("admin", "company_admin"),
  getOrganizationProfile
);
router.put(
  "/profile",
  protect,
  authorizeRoles("admin", "company_admin"),
  updateOrganizationProfile
);

// Super admin — list all organizations
router.get(
  "/",
  protect,
  authorizeRoles("super_admin"),
  getAllOrganizations
);

module.exports = router;
