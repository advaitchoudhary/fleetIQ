const express = require("express");
const { getAllOrgNotes } = require("../controller/driverNoteController.js");
const { protect, authorizeRoles } = require("../middleware/authMiddleware.js");
const { requireDriverModule } = require("../middleware/featureGate.js");

const router = express.Router();

router.get(
  "/",
  protect,
  authorizeRoles("admin", "company_admin", "dispatcher"),
  requireDriverModule,
  getAllOrgNotes
);

module.exports = router;
