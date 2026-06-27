const express = require("express");
const { getCalendarEvents, getUpcomingEvents, scheduleMaintenanceEvent } = require("../controller/schedulingController.js");
const { protect, authorizeRoles } = require("../middleware/authMiddleware.js");
const { requireGrowth } = require("../middleware/featureGate.js");

const router = express.Router();

router.use(protect, requireGrowth);

router.get("/calendar", getCalendarEvents);
router.get("/upcoming", getUpcomingEvents);
router.post("/events", authorizeRoles("admin", "company_admin", "dispatcher"), scheduleMaintenanceEvent);

module.exports = router;
