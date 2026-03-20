const express = require("express");
const {
  getAllTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getAllSchedules,
  getDueSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  generateMaintenanceFromSchedule,
} = require("../controller/pmController.js");
const { protect, authorizeRoles } = require("../middleware/authMiddleware.js");
const { requireVehicleModule } = require("../middleware/featureGate.js");

const router = express.Router();

router.use(protect, requireVehicleModule);

// Templates
router.get("/templates", getAllTemplates);
router.post("/templates", authorizeRoles("admin", "company_admin"), createTemplate);
router.put("/templates/:id", authorizeRoles("admin", "company_admin"), updateTemplate);
router.delete("/templates/:id", authorizeRoles("admin", "company_admin"), deleteTemplate);

// Schedules
router.get("/schedules/due", authorizeRoles("admin", "company_admin", "dispatcher"), getDueSchedules);
router.get("/schedules", getAllSchedules);
router.post("/schedules", authorizeRoles("admin", "company_admin", "dispatcher"), createSchedule);
router.put("/schedules/:id", authorizeRoles("admin", "company_admin", "dispatcher"), updateSchedule);
router.delete("/schedules/:id", authorizeRoles("admin", "company_admin"), deleteSchedule);
router.post("/schedules/:id/generate", authorizeRoles("admin", "company_admin", "dispatcher"), generateMaintenanceFromSchedule);

module.exports = router;
