const express = require("express");
const {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  assignDriver,
  getVehicleStats,
  uploadVehiclePhotos,
} = require("../controller/vehicleController.js");
const { protect, authorizeRoles } = require("../middleware/authMiddleware.js");
const { requireVehicleModule } = require("../middleware/featureGate.js");

const router = express.Router();

// All vehicle routes require auth + vehicle module subscription
router.use(protect, requireVehicleModule);

// Read routes — accessible to admin, company_admin, and dispatcher only (not driver)
router.get(
  "/",
  authorizeRoles("admin", "company_admin", "dispatcher"),
  getAllVehicles
);
router.get(
  "/:id/stats",
  authorizeRoles("admin", "company_admin", "dispatcher"),
  getVehicleStats
);
router.get(
  "/:id",
  authorizeRoles("admin", "company_admin", "dispatcher"),
  getVehicleById
);

// Write routes
router.post(
  "/",
  authorizeRoles("admin", "company_admin", "dispatcher"),
  uploadVehiclePhotos.array("photos", 5),
  createVehicle
);
router.put(
  "/:id",
  authorizeRoles("admin", "company_admin", "dispatcher"),
  uploadVehiclePhotos.array("photos", 5),
  updateVehicle
);
router.delete(
  "/:id",
  authorizeRoles("admin", "company_admin"),
  deleteVehicle
);
router.post(
  "/:id/assign-driver",
  authorizeRoles("admin", "company_admin", "dispatcher"),
  assignDriver
);

module.exports = router;
