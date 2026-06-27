const express = require("express");
const { getCostSummary, getCostTrend, getCostByCategory } = require("../controller/costTrackingController.js");
const { protect, authorizeRoles } = require("../middleware/authMiddleware.js");
const { requireGrowth } = require("../middleware/featureGate.js");

const router = express.Router();

router.use(protect, requireGrowth);

router.get("/summary", authorizeRoles("admin", "company_admin", "dispatcher"), getCostSummary);
router.get("/trend", authorizeRoles("admin", "company_admin", "dispatcher"), getCostTrend);
router.get("/by-category", authorizeRoles("admin", "company_admin", "dispatcher"), getCostByCategory);

module.exports = router;
