const mongoose = require("mongoose");

const driverNoteSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      required: true,
    },
    authorName: { type: String, required: true },
    type: {
      type: String,
      enum: ["General", "Warning", "Incident", "Compliment"],
      default: "General",
    },
    body: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DriverNote", driverNoteSchema);
