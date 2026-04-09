const mongoose = require("mongoose");

const telematicsDeviceSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },
    provider: { type: String, enum: ["geotab", "samsara"], required: true },
    deviceSerial: { type: String, required: true }, // Geotab serial OR Samsara vehicle ID
    credentials: { type: String, required: true },  // AES-256-GCM encrypted JSON string
    lastSync: { type: Date, default: null },
    lastError: { type: String, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

telematicsDeviceSchema.index({ organizationId: 1, vehicleId: 1 }, { unique: true });

module.exports = mongoose.model("TelematicsDevice", telematicsDeviceSchema);
