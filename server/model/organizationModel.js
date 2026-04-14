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
    timesheetCategories: {
      type: [String],
      default: [], // admin configures the available timesheet categories for their org
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
      // Set to true once the org has consumed their free trial (either started trialing
      // via Stripe or the initial 14-day trial has expired). Prevents granting a second trial.
      trialUsed: {
        type: Boolean,
        default: false,
      },
      currentPeriodEnd: { type: Date },
      // Reminder flags — prevent duplicate warning emails from the daily cron
      trialReminder3dSent: { type: Boolean, default: false },
      trialReminder1dSent: { type: Boolean, default: false },
      // Set once the trial-expired email has been sent, so it fires only once
      trialExpiredEmailSent: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Organization", organizationSchema);
