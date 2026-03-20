const mongoose = require("mongoose");

const warrantySchema = new mongoose.Schema(
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
    title: { type: String, required: true },
    type: {
      type: String,
      enum: ["manufacturer", "extended", "part", "tire", "battery", "other"],
      default: "manufacturer",
    },
    provider: { type: String },
    policyNumber: { type: String },
    startDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true },
    mileageLimit: { type: Number },
    currentMileage: { type: Number },
    coverageDetails: { type: String },
    status: {
      type: String,
      enum: ["active", "expired", "claimed", "voided"],
      default: "active",
    },
    claims: [
      {
        claimDate: { type: Date, required: true },
        description: { type: String, required: true },
        claimAmount: { type: Number, default: 0 },
        approvedAmount: { type: Number, default: 0 },
        status: {
          type: String,
          enum: ["submitted", "approved", "denied", "pending"],
          default: "submitted",
        },
        claimNumber: { type: String },
        notes: { type: String },
        documents: { type: [String], default: [] },
      },
    ],
    documents: { type: [String], default: [] },
    notes: { type: String },
  },
  { timestamps: true }
);

warrantySchema.index({ organizationId: 1, vehicleId: 1 });
warrantySchema.index({ organizationId: 1, expiryDate: 1 });

module.exports = mongoose.model("Warranty", warrantySchema);
