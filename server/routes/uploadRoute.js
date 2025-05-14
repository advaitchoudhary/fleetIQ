const express = require("express");
const { upload, processFile, getDispatches } = require("../controller/uploadController.js");

const router = express.Router();

// Upload route
router.post("/upload", upload, processFile);

// Get all dispatch records
router.get("/dispatches", getDispatches);

module.exports = router;