import express from "express";
import { upload, processFile, getDispatches } from "../controller/uploadController.js";

const router = express.Router();

// Upload route
router.post("/upload", upload, processFile);

// Get all dispatch records
router.get("/dispatches", getDispatches);

export default router;