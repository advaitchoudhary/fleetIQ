const express = require("express");
const { upload, processFile, getDispatches } = require("../controller/uploadController.js");
const { protect, authorizeRoles } = require("../middleware/authMiddleware.js");

const router = express.Router();

// All upload routes require authentication
router.use(protect);

// Upload dispatch PDF — restricted to admins and dispatchers
router.post("/upload", authorizeRoles("admin", "company_admin", "dispatcher"), upload, processFile);

// Get all dispatch records
router.get("/dispatches", getDispatches);

module.exports = router;