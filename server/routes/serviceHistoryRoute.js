const express = require("express");
const { getServiceHistory, getAllServiceHistory } = require("../controller/serviceHistoryController.js");
const { protect } = require("../middleware/authMiddleware.js");
const { requireGrowth } = require("../middleware/featureGate.js");

const router = express.Router();

router.use(protect, requireGrowth);

router.get("/", getAllServiceHistory);
router.get("/:vehicleId", getServiceHistory);

module.exports = router;
