import express from "express";
import {
  createTimesheet,
  getAllTimesheets,
  getTimesheetById,
  updateTimesheetById,
  deleteTimesheetById,
  updateTimesheetStatus
} from "../controller/timesheetController.js";

const router = express.Router();

router.post("/timesheet", createTimesheet);
router.get("/timesheets", getAllTimesheets);
router.get("/timesheet/:id", getTimesheetById);
router.put("/update/timesheet/:id", updateTimesheetById);
router.put("/timesheet/:id/status", updateTimesheetStatus);
router.delete("/delete/timesheet/:id", deleteTimesheetById);

export default router;