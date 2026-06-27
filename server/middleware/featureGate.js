const Organization = require("../model/organizationModel.js");

/**
 * Subscription tier enforcement.
 *
 * Plan hierarchy (higher rank = more access):
 *   "starter" (1) → drivers + vehicle basics (up to 10 vehicles/drivers)
 *   "growth"  (2) → + tracking, IFTA, integrations, parts, warranties,
 *                     service history, cost tracking, preventive maint., scheduling
 *   "pro"     (3) → + invoice generation, AI assistant (unlimited)
 *
 * Legacy plans (driver/vehicle/bundle) predate the tier model. They are ranked
 * high so existing customers keep the full access they had before tier
 * enforcement existed — avoids regressions during migration.
 *
 * Subscription statuses that allow access: "trialing" | "active"
 */
const PLAN_RANK = {
  starter: 1,
  growth: 2,
  pro: 3,
  // legacy — full access until migrated to a new tier
  driver: 99,
  vehicle: 99,
  bundle: 99,
};

const prettyPlan = (p) => (p ? p.charAt(0).toUpperCase() + p.slice(1) : p);

/**
 * Returns middleware that requires the caller's org to be on `minPlan` or higher.
 * `admin` role bypasses all gates.
 */
const requireTier = (minPlan) => async (req, res, next) => {
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

    const rank = PLAN_RANK[plan];
    if (!rank) {
      return res.status(403).json({
        message: `Your current plan ("${plan}") is not recognised. Please contact support.`,
        code: "FEATURE_NOT_IN_PLAN",
        currentPlan: plan,
      });
    }

    if (rank < PLAN_RANK[minPlan]) {
      return res.status(403).json({
        message: `This feature requires the ${prettyPlan(minPlan)} plan or higher. Upgrade your plan to access it.`,
        code: "FEATURE_NOT_IN_PLAN",
        currentPlan: plan,
        requiredPlan: minPlan,
      });
    }

    next();
  } catch (err) {
    console.error("featureGate error:", err);
    res.status(500).json({ message: "Internal server error checking feature access" });
  }
};

// Tier-named guards (use these in routes)
const requireStarter = requireTier("starter");
const requireGrowth = requireTier("growth");
const requirePro = requireTier("pro");

// Backwards-compatible module names.
//   driver + vehicle basics are included in every paid plan → starter tier
//   tracking is a Growth feature → growth tier
const requireDriverModule = requireStarter;
const requireVehicleModule = requireStarter;
const requireTrackingModule = requireGrowth;

module.exports = {
  requireTier,
  requireStarter,
  requireGrowth,
  requirePro,
  requireDriverModule,
  requireVehicleModule,
  requireTrackingModule,
};
