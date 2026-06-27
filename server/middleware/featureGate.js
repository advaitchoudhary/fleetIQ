const Organization = require("../model/organizationModel.js");

/**
 * Checks that the caller's organization has an active subscription.
 *
 * Subscription plans (all include every module):
 *   "starter" → up to ~10 vehicles/drivers
 *   "growth"  → up to ~30 vehicles/drivers
 *   "pro"     → unlimited
 *
 * Subscription statuses that allow access: "trialing" | "active"
 */
// Legacy plan names kept during migration from the old driver/vehicle/bundle model
const VALID_PLANS = ["starter", "growth", "pro", "driver", "vehicle", "bundle"];

const checkFeature = () => async (req, res, next) => {
  // admin role bypasses all feature gates
  if (req.user?.role === "admin") return next();

  const orgId = req.organizationId;
  if (!orgId) {
    return res.status(400).json({ message: "Organization context required" });
  }

  try {
    const org = await Organization.findById(orgId).select("subscription").lean();
    if (!org) {
      return res.status(401).json({ message: "Organization not found. Please log in again.", code: "ORG_NOT_FOUND" });
    }

    const { plan, status, trialEndsAt } = org.subscription || {};
    const activeStatuses = ["trialing", "active"];

    // Treat an expired trial as inactive even if the DB still says "trialing"
    const effectivelyActive =
      activeStatuses.includes(status) &&
      !(status === "trialing" && trialEndsAt && new Date(trialEndsAt) < new Date());

    if (!effectivelyActive) {
      return res.status(402).json({
        message: "Subscription inactive. Please renew your plan to continue.",
        code: "SUBSCRIPTION_INACTIVE",
      });
    }

    if (!VALID_PLANS.includes(plan)) {
      return res.status(403).json({
        message: `Your current plan ("${plan}") is not recognised. Please contact support.`,
        code: "FEATURE_NOT_IN_PLAN",
        currentPlan: plan,
      });
    }

    next();
  } catch (err) {
    console.error("featureGate error:", err);
    res.status(500).json({ message: "Internal server error checking feature access" });
  }
};

const requireDriverModule = checkFeature();
const requireVehicleModule = checkFeature();
const requireTrackingModule = checkFeature();

module.exports = { requireDriverModule, requireVehicleModule, requireTrackingModule };
