const Organization = require("../model/organizationModel.js");
const { sendTrialExpiringEmail } = require("./emailService.js");

/**
 * Runs daily via cron.  Finds orgs whose trial ends in exactly 3 days or 1 day
 * and sends a single warning email for each threshold, guarded by boolean flags
 * so re-runs of the cron never produce duplicate emails.
 */
const runSubscriptionReminders = async () => {
  const now = new Date();

  // Window boundaries — the cron fires at 09:00, so "within the next N days" means
  // trialEndsAt falls inside [now, now + N*24h + 1h].  The +1h buffer absorbs any
  // minor clock/scheduling drift.
  const in3dLow  = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const in3dHigh = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000);
  const in1dLow  = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
  const in1dHigh = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000);

  try {
    // ── 3-day warning ────────────────────────────────────────────────────────
    const orgs3d = await Organization.find({
      "subscription.status": "trialing",
      "subscription.trialEndsAt": { $gte: in3dLow, $lte: in3dHigh },
      "subscription.trialReminder3dSent": { $ne: true },
    }).select("name email subscription").lean();

    for (const org of orgs3d) {
      try {
        await sendTrialExpiringEmail(org.email, org.name, 3, org.subscription.trialEndsAt);
        await Organization.findByIdAndUpdate(org._id, {
          "subscription.trialReminder3dSent": true,
        });
      } catch (err) {
        console.error(`[SubscriptionReminders] 3d email failed for org ${org._id}:`, err.message);
      }
    }

    // ── 1-day warning ────────────────────────────────────────────────────────
    const orgs1d = await Organization.find({
      "subscription.status": "trialing",
      "subscription.trialEndsAt": { $gte: in1dLow, $lte: in1dHigh },
      "subscription.trialReminder1dSent": { $ne: true },
    }).select("name email subscription").lean();

    for (const org of orgs1d) {
      try {
        await sendTrialExpiringEmail(org.email, org.name, 1, org.subscription.trialEndsAt);
        await Organization.findByIdAndUpdate(org._id, {
          "subscription.trialReminder1dSent": true,
        });
      } catch (err) {
        console.error(`[SubscriptionReminders] 1d email failed for org ${org._id}:`, err.message);
      }
    }

    const total = orgs3d.length + orgs1d.length;
    if (total > 0) {
      console.log(`📧 SubscriptionReminders: sent ${orgs3d.length} × 3d warning, ${orgs1d.length} × 1d warning`);
    }
  } catch (err) {
    console.error("[SubscriptionReminders] Fatal error:", err);
  }
};

module.exports = { runSubscriptionReminders };
