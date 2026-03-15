const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Organization = require("../model/organizationModel.js");

// Map plan+billing to Stripe Price IDs (set in .env)
const PRICE_IDS = {
  driver: {
    monthly: process.env.STRIPE_PRICE_DRIVER_MONTHLY,
    annual: process.env.STRIPE_PRICE_DRIVER_ANNUAL,
  },
  vehicle: {
    monthly: process.env.STRIPE_PRICE_VEHICLE_MONTHLY,
    annual: process.env.STRIPE_PRICE_VEHICLE_ANNUAL,
  },
  bundle: {
    monthly: process.env.STRIPE_PRICE_BUNDLE_MONTHLY,
    annual: process.env.STRIPE_PRICE_BUNDLE_ANNUAL,
  },
};

/**
 * POST /api/subscriptions/create-checkout
 * Authenticated: Create a Stripe Checkout session to start/change a subscription.
 * Body: { plan: 'driver'|'vehicle'|'bundle', billing: 'monthly'|'annual' }
 */
const createCheckout = async (req, res) => {
  const { plan, billing = "monthly" } = req.body;

  const priceId = PRICE_IDS[plan]?.[billing];
  if (!priceId || priceId.startsWith("price_REPLACE")) {
    return res.status(400).json({
      message: `Stripe price ID for ${plan} (${billing}) is not configured. Set STRIPE_PRICE_${plan.toUpperCase()}_${billing.toUpperCase()} in your .env file.`,
    });
  }

  const org = await Organization.findById(req.organizationId);
  if (!org) return res.status(404).json({ message: "Organization not found" });

  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

  // Create or retrieve Stripe customer
  let customerId = org.subscription?.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: org.email,
      name: org.name,
      metadata: { organizationId: org._id.toString() },
    });
    customerId = customer.id;
    await Organization.findByIdAndUpdate(org._id, {
      "subscription.stripeCustomerId": customerId,
    });
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: 14,
      metadata: {
        organizationId: org._id.toString(),
        plan,
        billing,
      },
    },
    success_url: `${clientUrl}/subscription?checkout=success`,
    cancel_url: `${clientUrl}/subscription?checkout=cancel`,
  });

  res.json({ url: session.url, sessionId: session.id });
};

/**
 * GET /api/subscriptions/current
 * Authenticated: Get current subscription details.
 */
const getCurrentSubscription = async (req, res) => {
  const org = await Organization.findById(req.organizationId).select("subscription name email").lean();
  if (!org) return res.status(404).json({ message: "Organization not found" });

  const sub = org.subscription || {};
  res.json({
    plan: sub.plan || null,
    status: sub.status || "inactive",
    trialEndsAt: sub.trialEndsAt || null,
    currentPeriodEnd: sub.currentPeriodEnd || null,
    stripeCustomerId: sub.stripeCustomerId || null,
    stripeSubscriptionId: sub.stripeSubscriptionId || null,
  });
};

/**
 * POST /api/subscriptions/create-portal
 * Authenticated: Return Stripe Billing Portal URL so admin can manage their subscription.
 */
const createBillingPortal = async (req, res) => {
  const org = await Organization.findById(req.organizationId).select("subscription email").lean();
  if (!org) return res.status(404).json({ message: "Organization not found" });

  const customerId = org.subscription?.stripeCustomerId;
  if (!customerId) {
    return res.status(400).json({
      message: "No Stripe customer found. Please complete checkout first.",
    });
  }

  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${clientUrl}/subscription`,
  });

  res.json({ url: session.url });
};

/**
 * POST /api/subscriptions/webhook
 * Stripe webhook — handles subscription lifecycle events.
 * NOTE: This route uses raw body (set in route file).
 */
const handleWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error("Stripe subscription webhook error:", err.message);
    return res.status(400).json({ message: `Webhook Error: ${err.message}` });
  }

  const getOrgId = (obj) =>
    obj.metadata?.organizationId ||
    obj.subscription_data?.metadata?.organizationId;

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object;
      const orgId = sub.metadata?.organizationId;
      if (!orgId) break;

      const plan = sub.metadata?.plan;
      const statusMap = {
        trialing: "trialing",
        active: "active",
        past_due: "past_due",
        canceled: "cancelled",
        unpaid: "past_due",
      };

      await Organization.findByIdAndUpdate(orgId, {
        "subscription.plan": plan,
        "subscription.status": statusMap[sub.status] || sub.status,
        "subscription.stripeSubscriptionId": sub.id,
        "subscription.trialEndsAt": sub.trial_end ? new Date(sub.trial_end * 1000) : undefined,
        "subscription.currentPeriodEnd": new Date(sub.current_period_end * 1000),
      });
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object;
      const orgId = sub.metadata?.organizationId;
      if (!orgId) break;

      await Organization.findByIdAndUpdate(orgId, {
        "subscription.status": "cancelled",
      });
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object;
      // Keep subscription active
      if (invoice.subscription) {
        const sub = await stripe.subscriptions.retrieve(invoice.subscription);
        const orgId = sub.metadata?.organizationId;
        if (orgId) {
          await Organization.findByIdAndUpdate(orgId, {
            "subscription.status": "active",
            "subscription.currentPeriodEnd": new Date(sub.current_period_end * 1000),
          });
        }
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object;
      if (invoice.subscription) {
        const sub = await stripe.subscriptions.retrieve(invoice.subscription);
        const orgId = sub.metadata?.organizationId;
        if (orgId) {
          await Organization.findByIdAndUpdate(orgId, {
            "subscription.status": "past_due",
          });
        }
      }
      break;
    }

    case "checkout.session.completed": {
      const session = event.data.object;
      // If subscription was created via checkout, sync org
      if (session.subscription && session.customer) {
        const sub = await stripe.subscriptions.retrieve(session.subscription);
        const orgId = sub.metadata?.organizationId;
        const plan = sub.metadata?.plan;
        if (orgId) {
          await Organization.findByIdAndUpdate(orgId, {
            "subscription.plan": plan,
            "subscription.status": sub.status === "trialing" ? "trialing" : "active",
            "subscription.stripeCustomerId": session.customer,
            "subscription.stripeSubscriptionId": sub.id,
            "subscription.trialEndsAt": sub.trial_end ? new Date(sub.trial_end * 1000) : undefined,
            "subscription.currentPeriodEnd": new Date(sub.current_period_end * 1000),
          });
        }
      }
      break;
    }

    default:
      break;
  }

  res.json({ received: true });
};

module.exports = {
  createCheckout,
  getCurrentSubscription,
  createBillingPortal,
  handleWebhook,
};
