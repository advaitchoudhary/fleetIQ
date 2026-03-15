const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
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
    timesheetIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Timesheet",
      },
    ],
    amount: {
      type: Number,
      required: true, // in cents (Stripe uses smallest currency unit)
    },
    currency: {
      type: String,
      default: "cad",
    },
    status: {
      type: String,
      enum: ["pending", "processing", "paid", "failed"],
      default: "pending",
    },
    stripeTransferId: { type: String, default: null },
    stripePayoutId: { type: String, default: null },
    periodFrom: { type: Date },
    periodTo: { type: Date },
    paidAt: { type: Date, default: null },
    notes: { type: String, default: "" },
    failureReason: { type: String, default: null },
  },
  { timestamps: true }
);

paymentSchema.index({ organizationId: 1, createdAt: -1 });
paymentSchema.index({ driverId: 1, createdAt: -1 });

module.exports = mongoose.model("Payment", paymentSchema);
