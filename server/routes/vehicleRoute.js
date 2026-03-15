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

router.get("/", getAllVehicles);
router.post(
  "/",
  authorizeRoles("admin", "company_admin", "dispatcher"),
  uploadVehiclePhotos.array("photos", 5),
  createVehicle
);
router.get("/:id/stats", getVehicleStats);
router.get("/:id", getVehicleById);
router.put(
  "/:id",
  authorizeRoles("admin", "company_admin", "dispatcher"),
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
