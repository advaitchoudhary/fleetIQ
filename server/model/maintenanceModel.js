const mongoose = require("mongoose");

const maintenanceSchema = new mongoose.Schema(
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
    type: {
      type: String,
      enum: ["preventive", "corrective", "inspection", "tire", "oil_change", "other"],
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String },
    status: {
      type: String,
      enum: ["scheduled", "in_progress", "completed", "cancelled"],
      default: "scheduled",
    },
    scheduledDate: { type: Date },
    completedDate: { type: Date },
    odometer: { type: Number }, // odometer at time of service
    cost: { type: Number, default: 0 },
    vendor: { type: String },   // shop / mechanic name
    documents: { type: [String], default: [] }, // receipts / work orders
    notes: { type: String },
  },
  { timestamps: true }
);

maintenanceSchema.index({ organizationId: 1, vehicleId: 1 });

module.exports = mongoose.model("Maintenance", maintenanceSchema);
