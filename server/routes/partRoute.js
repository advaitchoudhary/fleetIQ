const express = require("express");
const {
  getAllParts,
  getLowStockAlerts,
  getPartById,
  createPart,
  updatePart,
  deletePart,
  usePart,
} = require("../controller/partController.js");
const { protect, authorizeRoles } = require("../middleware/authMiddleware.js");
const { requireVehicleModule } = require("../middleware/featureGate.js");

const router = express.Router();

router.use(protect, requireVehicleModule);

router.get("/low-stock", authorizeRoles("admin", "company_admin", "dispatcher"), getLowStockAlerts);
router.get("/", getAllParts);
router.post("/", authorizeRoles("admin", "company_admin", "dispatcher"), createPart);
router.get("/:id", getPartById);
router.put("/:id", authorizeRoles("admin", "company_admin", "dispatcher"), updatePart);
router.delete("/:id", authorizeRoles("admin", "company_admin"), deletePart);
router.post("/:id/use", authorizeRoles("admin", "company_admin", "dispatcher"), usePart);

module.exports = router;
