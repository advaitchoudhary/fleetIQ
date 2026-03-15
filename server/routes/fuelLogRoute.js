const express = require("express");
const {
  getAllFuelLogs,
  getFuelStats,
  getFuelLogById,
  createFuelLog,
  updateFuelLog,
  deleteFuelLog,
  uploadFuelReceipt,
} = require("../controller/fuelLogController.js");
const { protect, authorizeRoles } = require("../middleware/authMiddleware.js");
const { requireVehicleModule } = require("../middleware/featureGate.js");

const router = express.Router();

router.use(protect, requireVehicleModule);

router.get("/stats", getFuelStats);
router.get("/", getAllFuelLogs);
router.post(
  "/",
  uploadFuelReceipt.single("receiptPhoto"),
  createFuelLog // drivers + admins
);
router.get("/:id", getFuelLogById);
router.put("/:id", updateFuelLog);
router.delete("/:id", authorizeRoles("admin", "company_admin", "dispatcher"), deleteFuelLog);

module.exports = router;
