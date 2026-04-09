const express = require("express");
const router = express.Router();
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const { requireVehicleModule } = require("../middleware/featureGate");
const { generateReport, downloadPDF } = require("../controller/iftaController");

const ALL_ADMIN = ["admin", "company_admin", "dispatcher"];

router.get("/report", protect, authorizeRoles(...ALL_ADMIN), requireVehicleModule, generateReport);
router.get("/report/pdf", protect, authorizeRoles(...ALL_ADMIN), requireVehicleModule, downloadPDF);

module.exports = router;
