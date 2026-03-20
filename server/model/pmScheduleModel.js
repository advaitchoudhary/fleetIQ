const mongoose = require("mongoose");

const pmScheduleSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PMTemplate",
      required: true,
    },
    lastCompletedDate: { type: Date },
    lastCompletedOdometer: { type: Number },
    nextDueDate: { type: Date },
    nextDueOdometer: { type: Number },
    status: {
      type: String,
      enum: ["on_track", "due_soon", "overdue"],
      default: "on_track",
    },
    linkedMaintenanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Maintenance",
      default: null,
    },
    isActive: { type: Boolean, default: true },
    notes: { type: String },
  },
  { timestamps: true }
);

pmScheduleSchema.index({ organizationId: 1, vehicleId: 1 });

module.exports = mongoose.model("PMSchedule", pmScheduleSchema);
