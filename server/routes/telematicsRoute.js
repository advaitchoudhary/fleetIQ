const express = require("express");
const router = express.Router();
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const { requireVehicleModule } = require("../middleware/featureGate");
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

router.post("/test", protect, authorizeRoles(...ADMIN_ROLES), requireVehicleModule, testConnection);
router.post("/devices", protect, authorizeRoles(...ADMIN_ROLES), requireVehicleModule, pairDevice);
router.get("/devices", protect, authorizeRoles(...ALL_ADMIN), requireVehicleModule, getOrgDevices);
router.delete("/devices/:id", protect, authorizeRoles(...ADMIN_ROLES), requireVehicleModule, unpairDevice);
router.post("/devices/:id/sync", protect, authorizeRoles(...ADMIN_ROLES), requireVehicleModule, syncNow);
router.post("/discover", protect, authorizeRoles(...ADMIN_ROLES), requireVehicleModule, discoverDevices);
router.post("/bulk-pair", protect, authorizeRoles(...ADMIN_ROLES), requireVehicleModule, bulkPair);

module.exports = router;
