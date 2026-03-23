const Organization = require("../model/organizationModel.js");

/**
 * Checks that the caller's organization has an active subscription that
 * includes the requested module.
 *
 * Subscription plans:
 *   "driver"  → only driver management features
 *   "vehicle" → only vehicle management features
 *   "bundle"  → both driver + vehicle management
 *
 * Subscription statuses that allow access: "trialing" | "active"
 */
const checkFeature = (requiredPlan) => async (req, res, next) => {
  // admin role bypasses all feature gates
  if (req.user?.role === "admin") return next();

  const orgId = req.organizationId;
  if (!orgId) {
    return res.status(400).json({ message: "Organization context required" });
  }

  try {
    const org = await Organization.findById(orgId).select("subscription").lean();
    if (!org) {
      return res.status(404).json({ message: "Organization not found" });
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

    // Plan-based access control: bundle covers everything
    const hasAccess = plan === "bundle" || plan === requiredPlan;

    if (!hasAccess) {
      return res.status(403).json({
        message: `Your current plan ("${plan}") does not include the ${requiredPlan} module. Upgrade to access this feature.`,
        code: "FEATURE_NOT_IN_PLAN",
        currentPlan: plan,
        requiredPlan,
      });
    }

    next();
  } catch (err) {
    console.error("featureGate error:", err);
    res.status(500).json({ message: "Internal server error checking feature access" });
  }
};

const requireDriverModule = checkFeature("driver");
const requireVehicleModule = checkFeature("vehicle");

module.exports = { requireDriverModule, requireVehicleModule };
