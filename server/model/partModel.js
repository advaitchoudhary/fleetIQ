const mongoose = require("mongoose");

const partSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    name: { type: String, required: true },
    partNumber: { type: String },
    category: {
      type: String,
      enum: ["engine", "brakes", "tires", "electrical", "body", "filters", "fluids", "other"],
      default: "other",
    },
    description: { type: String },
    quantity: { type: Number, required: true, default: 0 },
    minimumQuantity: { type: Number, default: 0 },
    unitCost: { type: Number, default: 0 },
    supplier: { type: String },
    location: { type: String },
    compatibleVehicles: [{ type: mongoose.Schema.Types.ObjectId, ref: "Vehicle" }],
    usageHistory: [
      {
        maintenanceId: { type: mongoose.Schema.Types.ObjectId, ref: "Maintenance" },
        vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle" },
        quantityUsed: { type: Number, required: true },
        usedAt: { type: Date, default: Date.now },
        notes: { type: String },
      },
    ],
    notes: { type: String },
  },
  { timestamps: true }
);

partSchema.index({ organizationId: 1 });
partSchema.index({ organizationId: 1, name: 1 });

module.exports = mongoose.model("Part", partSchema);
