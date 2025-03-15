import mongoose from "mongoose";

const timesheetSchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    driver: { type: String, required: true },
    customer: { type: String, required: true },
    startDate: { type: String, required: true },
    category: { type: String, required: true },
    tripNumber: { type: String, required: true },
    loadID: { type: String, required: true },
    preStartTime: { type: String, required: true },
    gateOutTime: { type: String, required: true },
    ewStartTimeMorning: { type: String },
    ewEndTimeMorning: { type: String },
    ewReasonMorning: { type: String },
    gateInTime: { type: String, required: true },
    postEndTime: { type: String },
    endDate: { type: String },
    ewStartTimeEvening: { type: String },
    ewEndTimeEvening: { type: String },
    ewReasonEvening: { type: String },
    plannedHours: { type: String },
    totalStops: { type: String },
    plannedKM: { type: String },
    startKM: { type: Number, required: true, min: 0 },
    endKM: { type: Number, required: true, min: 0 },
    comments: { type: String },
    attachments: { type: [String], default: [] }, // Array of file URLs
  },
  { timestamps: true }
);

export default mongoose.model("Timesheet", timesheetSchema);