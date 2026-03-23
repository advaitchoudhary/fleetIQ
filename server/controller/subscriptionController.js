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
  try {
    const { plan, billing = "monthly" } = req.body;

    if (!plan || !PRICE_IDS[plan]) {
      return res.status(400).json({ message: `Invalid plan: "${plan}". Must be driver, vehicle, or bundle.` });
    }

    const priceId = PRICE_IDS[plan]?.[billing];
    if (!priceId || priceId.startsWith("price_REPLACE")) {
      return res.status(400).json({
        message: `Stripe price ID for ${plan} (${billing}) is not configured. Set STRIPE_PRICE_${plan.toUpperCase()}_${billing.toUpperCase()} in your .env file.`,
      });
    }

    // admin without an org context cannot create a checkout — require org scope
    if (!req.organizationId) {
      return res.status(400).json({ message: "Organization context required. Switch into an org first." });
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
  } catch (err) {
    console.error("createCheckout error:", err);
    res.status(500).json({ message: err.message || "Failed to create checkout session" });
  }
};

/**
 * GET /api/subscriptions/current
 * Authenticated: Get current subscription details.
 */
const getCurrentSubscription = async (req, res) => {
  try {
    if (!req.organizationId) {
      return res.status(400).json({ message: "Organization context required." });
    }

    const org = await Organization.findById(req.organizationId).select("subscription name email").lean();
    if (!org) return res.status(404).json({ message: "Organization not found" });

    const sub = org.subscription || {};

    // Derive effective status: if org has no Stripe subscription and the trial
    // period has passed, report as inactive rather than the stale "trialing".
    let status = sub.status || "inactive";
    if (status === "trialing" && sub.trialEndsAt && new Date(sub.trialEndsAt) < new Date()) {
      status = "inactive";
    }

    res.json({
      plan: sub.plan || null,
      status,
      trialEndsAt: sub.trialEndsAt || null,
      currentPeriodEnd: sub.currentPeriodEnd || null,
      stripeCustomerId: sub.stripeCustomerId || null,
      stripeSubscriptionId: sub.stripeSubscriptionId || null,
    });
  } catch (err) {
    console.error("getCurrentSubscription error:", err);
    res.status(500).json({ message: err.message || "Failed to fetch subscription" });
  }
};

/**
 * POST /api/subscriptions/create-portal
 * Authenticated: Return Stripe Billing Portal URL so admin can manage their subscription.
 */
const createBillingPortal = async (req, res) => {
  try {
    if (!req.organizationId) {
      return res.status(400).json({ message: "Organization context required." });
    }

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
  } catch (err) {
    console.error("createBillingPortal error:", err);
    res.status(500).json({ message: err.message || "Failed to create billing portal session" });
  }
};

/**
 * POST /api/subscriptions/webhook
 * Stripe webhook — handles subscription lifecycle events.
 * NOTE: This route uses raw body (set in route file), mounted before bodyParser.json().
 */
const handleWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return res.status(500).send("Webhook secret not configured");
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error("Stripe subscription webhook signature error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const statusMap = {
    trialing: "trialing",
    active: "active",
    past_due: "past_due",
    canceled: "cancelled",
    unpaid: "past_due",
  };

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object;
        const orgId = sub.metadata?.organizationId;
        if (!orgId) {
          console.warn(`subscription event ${event.type} missing organizationId in metadata`);
          break;
        }

        const plan = sub.metadata?.plan;
        if (!plan) {
          console.warn(`subscription event ${event.type} missing plan in metadata for org ${orgId}`);
        }

        const update = {
          "subscription.status": statusMap[sub.status] || sub.status,
          "subscription.stripeSubscriptionId": sub.id,
          "subscription.currentPeriodEnd": new Date(sub.current_period_end * 1000),
        };
        if (plan) update["subscription.plan"] = plan;
        if (sub.trial_end) update["subscription.trialEndsAt"] = new Date(sub.trial_end * 1000);

        await Organization.findByIdAndUpdate(orgId, update);
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
        // Keep subscription active after successful renewal
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
        // Sync org after a successful checkout that created a subscription
        if (session.subscription && session.customer) {
          const sub = await stripe.subscriptions.retrieve(session.subscription);
          const orgId = sub.metadata?.organizationId;
          const plan = sub.metadata?.plan;

          if (!orgId) {
            console.warn("checkout.session.completed: missing organizationId in subscription metadata");
            break;
          }
          if (!plan) {
            console.warn(`checkout.session.completed: missing plan in subscription metadata for org ${orgId}`);
          }

          const update = {
            "subscription.status": statusMap[sub.status] || (sub.status === "trialing" ? "trialing" : "active"),
            "subscription.stripeCustomerId": session.customer,
            "subscription.stripeSubscriptionId": sub.id,
            "subscription.currentPeriodEnd": new Date(sub.current_period_end * 1000),
          };
          if (plan) update["subscription.plan"] = plan;
          if (sub.trial_end) update["subscription.trialEndsAt"] = new Date(sub.trial_end * 1000);

          await Organization.findByIdAndUpdate(orgId, update);
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error(`Error processing webhook event ${event.type}:`, err);
    // Still return 200 to Stripe to avoid retries for processing errors
    return res.status(200).json({ received: true, error: err.message });
  }

  res.status(200).json({ received: true });
};

module.exports = {
  createCheckout,
  getCurrentSubscription,
  createBillingPortal,
  handleWebhook,
};
