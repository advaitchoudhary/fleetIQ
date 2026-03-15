const express = require("express");
const {
  getAllInspections,
  getDefaultChecklist,
  getInspectionById,
  createInspection,
  updateInspection,
  deleteInspection,
  uploadInspectionPhotos,
} = require("../controller/inspectionController.js");
const { protect, authorizeRoles } = require("../middleware/authMiddleware.js");
const { requireVehicleModule } = require("../middleware/featureGate.js");

const router = express.Router();

router.use(protect, requireVehicleModule);

// Default checklist — available to drivers too (they need it to fill out DVIR)
router.get("/default-checklist", getDefaultChecklist);

router.get("/", getAllInspections);
router.post(
  "/",
  uploadInspectionPhotos.array("photos", 10),
  createInspection // drivers + admins can submit
);
router.get("/:id", getInspectionById);
router.put(
  "/:id",
  authorizeRoles("admin", "company_admin", "dispatcher"),
  updateInspection
);
router.delete(
  "/:id",
  authorizeRoles("admin", "company_admin"),
  deleteInspection
);

module.exports = router;
