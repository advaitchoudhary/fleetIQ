const express = require("express");
const {
  getAllWarranties,
  getExpiryAlerts,
  getWarrantyById,
  createWarranty,
  updateWarranty,
  deleteWarranty,
  addClaim,
  updateClaim,
  uploadWarrantyDocs,
} = require("../controller/warrantyController.js");
const { protect, authorizeRoles } = require("../middleware/authMiddleware.js");
const { requireVehicleModule } = require("../middleware/featureGate.js");

const router = express.Router();

router.use(protect, requireVehicleModule);

router.get("/expiry-alerts", authorizeRoles("admin", "company_admin", "dispatcher"), getExpiryAlerts);
router.get("/", getAllWarranties);
router.post(
  "/",
  authorizeRoles("admin", "company_admin", "dispatcher"),
  uploadWarrantyDocs.array("documents", 5),
  createWarranty
);
router.get("/:id", getWarrantyById);
router.put("/:id", authorizeRoles("admin", "company_admin", "dispatcher"), updateWarranty);
router.delete("/:id", authorizeRoles("admin", "company_admin"), deleteWarranty);
router.post("/:id/claims", authorizeRoles("admin", "company_admin", "dispatcher"), addClaim);
router.put("/:id/claims/:claimId", authorizeRoles("admin", "company_admin", "dispatcher"), updateClaim);

module.exports = router;
