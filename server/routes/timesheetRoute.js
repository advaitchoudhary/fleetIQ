import express from "express";
import {
  createTimesheet,
  getAllTimesheets,
  getTimesheetById,
  updateTimesheetById,
  deleteTimesheetById,
} from "../controller/timesheetController.js";

const router = express.Router();

router.post("/timesheet", createTimesheet);
router.get("/timesheets", getAllTimesheets);
router.get("/timesheet/:id", getTimesheetById);
router.put("/update/timesheet/:id", updateTimesheetById);
router.delete("/delete/timesheet/:id", deleteTimesheetById);

export default router;