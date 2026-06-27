const express = require("express");
const router = express.Router();
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const { requireGrowth } = require("../middleware/featureGate");
const {
  testConnection,
  pairDevice,
  getOrgDevices,
  unpairDevice,
  syncNow,
  discoverDevices,
  bulkPair,
} = require("../controller/telematicsController");

const ADMIN_ROLES = ["admin", "company_admin"];
const ALL_ADMIN = ["admin", "company_admin", "dispatcher"];

router.post("/test", protect, authorizeRoles(...ADMIN_ROLES), requireGrowth, testConnection);
router.post("/devices", protect, authorizeRoles(...ADMIN_ROLES), requireGrowth, pairDevice);
router.get("/devices", protect, authorizeRoles(...ALL_ADMIN), requireGrowth, getOrgDevices);
router.delete("/devices/:id", protect, authorizeRoles(...ADMIN_ROLES), requireGrowth, unpairDevice);
router.post("/devices/:id/sync", protect, authorizeRoles(...ADMIN_ROLES), requireGrowth, syncNow);
router.post("/discover", protect, authorizeRoles(...ADMIN_ROLES), requireGrowth, discoverDevices);
router.post("/bulk-pair", protect, authorizeRoles(...ADMIN_ROLES), requireGrowth, bulkPair);

module.exports = router;
