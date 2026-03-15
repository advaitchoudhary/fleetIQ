const express = require("express");
const {
  getAllMaintenance,
  getMaintenanceById,
  createMaintenance,
  updateMaintenance,
  deleteMaintenance,
  getDueAlerts,
  uploadMaintenanceDocs,
} = require("../controller/maintenanceController.js");
const { protect, authorizeRoles } = require("../middleware/authMiddleware.js");
const { requireVehicleModule } = require("../middleware/featureGate.js");

const router = express.Router();

router.use(protect, requireVehicleModule);

router.get("/due-alerts", authorizeRoles("admin", "company_admin", "dispatcher"), getDueAlerts);
router.get("/", getAllMaintenance);
router.post(
  "/",
  authorizeRoles("admin", "company_admin", "dispatcher"),
  uploadMaintenanceDocs.array("documents", 5),
  createMaintenance
);
router.get("/:id", getMaintenanceById);
router.put("/:id", authorizeRoles("admin", "company_admin", "dispatcher"), updateMaintenance);
router.delete("/:id", authorizeRoles("admin", "company_admin"), deleteMaintenance);

module.exports = router;
