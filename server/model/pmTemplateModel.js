const mongoose = require("mongoose");

const pmTemplateSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    name: { type: String, required: true },
    description: { type: String },
    maintenanceType: {
      type: String,
      enum: ["preventive", "inspection", "tire", "oil_change", "other"],
      default: "preventive",
    },
    intervalKm: { type: Number },
    intervalDays: { type: Number },
    estimatedCost: { type: Number, default: 0 },
    estimatedDuration: { type: Number },
    vendor: { type: String },
    applicableVehicleTypes: {
      type: [String],
      enum: ["truck", "trailer", "van", "pickup", "other"],
      default: [],
    },
    isActive: { type: Boolean, default: true },
    notes: { type: String },
  },
  { timestamps: true }
);

pmTemplateSchema.index({ organizationId: 1 });

module.exports = mongoose.model("PMTemplate", pmTemplateSchema);
