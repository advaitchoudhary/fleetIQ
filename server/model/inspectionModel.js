const mongoose = require("mongoose");

// DVIR — Driver Vehicle Inspection Report
// Required by FMCSA regulations for commercial vehicles.
const inspectionSchema = new mongoose.Schema(
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
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      required: true,
    },
    type: {
      type: String,
      enum: ["pre_trip", "post_trip", "annual"],
      required: true,
    },
    date: { type: Date, required: true },
    odometer: { type: Number },
    status: {
      type: String,
      enum: ["satisfactory", "defects_noted", "out_of_service"],
      default: "satisfactory",
    },
    // Standardized DVIR checklist items
    checklistItems: [
      {
        category: { type: String, required: true }, // e.g. "Brakes", "Lights", "Tires"
        item: { type: String, required: true },      // e.g. "Service brakes"
        status: {
          type: String,
          enum: ["ok", "defect"],
          default: "ok",
        },
        notes: { type: String },
      },
    ],
    driverSignature: { type: String }, // base64 data URI or file path
    mechanicSignature: { type: String },
    mechanicNotes: { type: String },   // admin / mechanic can add repair notes
    photos: { type: [String], default: [] },
  },
  { timestamps: true }
);

inspectionSchema.index({ organizationId: 1, vehicleId: 1 });
inspectionSchema.index({ organizationId: 1, driverId: 1 });

module.exports = mongoose.model("Inspection", inspectionSchema);
