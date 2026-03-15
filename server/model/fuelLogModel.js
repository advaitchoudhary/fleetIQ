const mongoose = require("mongoose");

const fuelLogSchema = new mongoose.Schema(
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
      default: null,
    },
    date: { type: Date, required: true },
    odometer: { type: Number, required: true }, // odometer at fill-up
    litres: { type: Number, required: true },    // fuel quantity (litres for CA)
    pricePerLitre: { type: Number, required: true },
    totalCost: { type: Number, required: true },
    fuelType: {
      type: String,
      enum: ["diesel", "gasoline", "electric", "hybrid"],
      default: "diesel",
    },
    fuelStation: { type: String },
    city: { type: String },
    receiptPhoto: { type: String }, // file path
    notes: { type: String },
  },
  { timestamps: true }
);

fuelLogSchema.index({ organizationId: 1, vehicleId: 1 });

module.exports = mongoose.model("FuelLog", fuelLogSchema);
