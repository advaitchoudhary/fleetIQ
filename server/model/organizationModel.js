const mongoose = require("mongoose");

const organizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true }, // Company admin email
    phone: { type: String },
    address: { type: String },
    dotNumber: { type: String }, // DOT/MC number for trucking compliance
    digestSections: {
      type: [String],
      default: [], // empty = use server default (DIGEST_DEFAULT_SECTIONS env var)
    },
    mandatoryTrainings: {
      type: [String],
      default: [], // admin configures the list; empty = not set up yet
    },
    mandatoryDocuments: {
      type: [String],
      default: [], // admin configures the list of required compliance document names
    },
    integrationType: {
      type: String,
      enum: ["browser", "geotab", "samsara"],
      default: "browser",
    },
    subscription: {
      plan: {
        type: String,
        enum: ["driver", "vehicle", "bundle"],
        default: "driver",
      },
      status: {
        type: String,
        enum: ["trialing", "active", "past_due", "cancelled"],
        default: "trialing",
      },
      stripeCustomerId: { type: String },
      stripeSubscriptionId: { type: String },
      trialEndsAt: {
        type: Date,
        default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14-day trial
      },
      currentPeriodEnd: { type: Date },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Organization", organizationSchema);
