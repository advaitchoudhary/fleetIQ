const mongoose = require("mongoose");

const timesheetSchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    driver: { type: String },
    driverName: { type: String },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    customer: { type: String, required: true },
    totalHours: { type: String },
    category: { type: String, required: true },
    tripNumber: { type: String, required: true },
    loadID: { type: String, required: true },
    gateOutTime: { type: String, required: true },
    gateInTime: { type: String, required: true },
    plannedHours: { type: String },
    plannedKM: { type: String },
    startKM: { type: Number, required: true, min: 0 },
    endKM: { type: Number, required: true, min: 0 },
    comments: { type: String },
    attachments: { type: [String], default: [] },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    extraWorkSheet: { type: String, enum: ["yes", "no"], default: "no" },
    extraDuration: { type: String },
    durationFrom: { type: String },
    durationTo: { type: String },

    // Delay logging fields
    extraDelay: { type: String, enum: ["yes", "no"], default: "no" },

    delayStoreDuration: { type: String },
    delayStoreFrom: { type: String },
    delayStoreTo: { type: String },
    delayStoreReason: { type: String },

    delayRoadDuration: { type: String },
    delayRoadFrom: { type: String },
    delayRoadTo: { type: String },
    delayRoadReason: { type: String },

    delayOtherDuration: { type: String },
    delayOtherFrom: { type: String },
    delayOtherTo: { type: String },
    delayOtherReason: { type: String },

    
  },
  { timestamps: true }
);

module.exports = mongoose.model("Timesheet", timesheetSchema);