const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const { requireTrackingModule } = require("../middleware/featureGate");
const { startTrip, updateLocation, endTrip, getLiveLocations, getTripHistory, getMyVehicle } = require("../controller/trackingController");

// Max 5 pings per 2 minutes per driver (30s interval = 4 legitimate pings, 5 gives buffer)
const locationRateLimit = rateLimit({
  windowMs: 2 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.user.id, // protect middleware runs first, so id is always set
  message: { message: "Too many location updates. Please wait before sending again." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get("/my-vehicle", protect, authorizeRoles("driver"), requireTrackingModule, getMyVehicle);
router.post("/trips/start", protect, authorizeRoles("driver"), requireTrackingModule, startTrip);
router.post("/location", protect, authorizeRoles("driver"), locationRateLimit, updateLocation);
router.post("/trips/:tripId/end", protect, authorizeRoles("driver"), endTrip);
router.get("/live", protect, authorizeRoles("admin", "company_admin", "dispatcher"), requireTrackingModule, getLiveLocations);
router.get("/history/:vehicleId", protect, authorizeRoles("admin", "company_admin", "dispatcher"), requireTrackingModule, getTripHistory);

module.exports = router;
