const mongoose = require("mongoose");

// Define schema for Dispatch Sheet
const dispatchSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
    },
    route: String,
    loadId: String,
    trailerType: String,
    tripDate: String,
    storeNumber: String,
    storeName: String,
    eta: String,
    city: String,
    stopNumber: String,
    windowIn: String,
    windowOut: String,
    commodity: String,
    totalPCS: String,
    totalCube: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Dispatch", dispatchSchema);