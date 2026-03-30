const mongoose = require("mongoose");

const coordSchema = new mongoose.Schema(
  {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    speed: { type: Number, default: 0 },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const locationSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", required: true },
    tripStart: { type: Date, default: Date.now },
    tripEnd: { type: Date, default: null },
    totalDistance: { type: Number, default: 0 },
    coordinates: [coordSchema],
  },
  { timestamps: true }
);

// Indexes for efficient querying at scale
locationSchema.index({ vehicleId: 1, tripEnd: 1 });         // getTripHistory filter
locationSchema.index({ organizationId: 1, tripEnd: 1 });    // org-level trip queries
locationSchema.index({ vehicleId: 1, tripStart: -1 });      // sort by recent trips
// TTL: auto-delete completed trips older than 1 year (only fires when tripEnd is set)
locationSchema.index({ tripEnd: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

module.exports = mongoose.model("Location", locationSchema);
