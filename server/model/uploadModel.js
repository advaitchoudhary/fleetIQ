import mongoose from "mongoose";

// Define schema for Dispatch Sheet
const dispatchSchema = new mongoose.Schema(
  {
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

export default mongoose.model("Dispatch", dispatchSchema);