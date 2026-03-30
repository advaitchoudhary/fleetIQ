const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    unitNumber: { type: String, required: true }, // e.g. "TRUCK-001"
    make: { type: String, default: "" },           // e.g. "Freightliner"
    model: { type: String, default: "" },          // e.g. "Cascadia"
    year: { type: Number },
    vin: { type: String },
    licensePlate: { type: String },
    type: {
      type: String,
      enum: ["truck", "trailer", "van", "pickup", "other"],
      default: "truck",
    },
    status: {
      type: String,
      enum: ["active", "inactive", "in_maintenance", "out_of_service"],
      default: "active",
    },
    odometer: { type: Number, default: 0 }, // current odometer reading (km)
    ownership: {
      type: String,
      enum: ["owned", "leased", "rented"],
      default: "owned",
    },
    assignedDriverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      default: null,
    },
    fuelType: {
      type: String,
      enum: ["diesel", "gasoline", "electric", "hybrid"],
      default: "diesel",
    },
    insuranceExpiry: { type: Date },
    registrationExpiry: { type: Date },
    photos: { type: [String], default: [] },
    notes: { type: String },
    lastLocation: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      speed: { type: Number, default: null },
      timestamp: { type: Date, default: null },
      isActive: { type: Boolean, default: false },
      driverId: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", default: null },
    },
  },
  { timestamps: true }
);

// Compound index: unitNumber must be unique within an organization
vehicleSchema.index({ organizationId: 1, unitNumber: 1 }, { unique: true });

module.exports = mongoose.model("Vehicle", vehicleSchema);
