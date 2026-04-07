const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Driver = require("../model/driverModel.js");
const Payment = require("../model/paymentModel.js");
const Timesheet = require("../model/timesheetModel.js");
const { getOrgFilter } = require("../middleware/authMiddleware.js");

/**
 * POST /api/payments/onboard/:driverId
 * Admin: Create Stripe Express account for a driver and return onboarding link.
 */
const onboardDriver = async (req, res) => {
  const { driverId } = req.params;
  const orgFilter = getOrgFilter(req);

  const driver = await Driver.findOne({ _id: driverId, ...orgFilter });
  if (!driver) return res.status(404).json({ message: "Driver not found" });

  // If already has a Stripe account, return a new onboarding link
  let accountId = driver.stripeAccountId;
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      country: "CA",
      email: driver.email,
      capabilities: {
        transfers: { requested: true },
      },
      business_type: "individual",
      metadata: {
        driverId: driverId.toString(),
        organizationId: req.organizationId?.toString() || "",
      },
    });
    accountId = account.id;
    await Driver.findByIdAndUpdate(driverId, {
      stripeAccountId: accountId,
      stripeOnboardingComplete: false,
    });
  }

  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${clientUrl}/payments?onboard=refresh&driverId=${driverId}`,
    return_url: `${clientUrl}/payments?onboard=return&driverId=${driverId}`,
    type: "account_onboarding",
  });

  res.json({ url: accountLink.url, stripeAccountId: accountId });
};

/**
 * GET /api/payments/onboard-status/:driverId
 * Admin: Check if a driver has completed Stripe onboarding.
 */
const getOnboardStatus = async (req, res) => {
  const { driverId } = req.params;
  const orgFilter = getOrgFilter(req);

  const driver = await Driver.findOne({ _id: driverId, ...orgFilter }).select(
    "stripeAccountId stripeOnboardingComplete name"
  );
  if (!driver) return res.status(404).json({ message: "Driver not found" });

  if (!driver.stripeAccountId) {
    return res.json({ onboarded: false, stripeAccountId: null });
  }

  // Verify with Stripe
  const account = await stripe.accounts.retrieve(driver.stripeAccountId);
  const onboarded =
    account.charges_enabled && account.payouts_enabled;

  if (onboarded && !driver.stripeOnboardingComplete) {
    await Driver.findByIdAndUpdate(driverId, { stripeOnboardingComplete: true });
  }

  res.json({
    onboarded,
    stripeAccountId: driver.stripeAccountId,
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
  });
};

/**
 * POST /api/payments/calculate
 * Admin: Preview payout amount for a driver over a date range.
 * Body: { driverId, periodFrom, periodTo }
 */
const calculatePayout = async (req, res) => {
  const { driverId, periodFrom, periodTo } = req.body;
  const orgFilter = getOrgFilter(req);

  const driver = await Driver.findOne({ _id: driverId, ...orgFilter });
  if (!driver) return res.status(404).json({ message: "Driver not found" });

  const dateFilter = {};
  if (periodFrom) dateFilter.$gte = new Date(periodFrom);
  if (periodTo) dateFilter.$lte = new Date(periodTo);

  const timesheets = await Timesheet.find({
    ...orgFilter,
    driverEmail: driver.email,
    status: "approved",
    ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
  }).lean();

  const totalAmount = timesheets.reduce((sum, ts) => {
    return sum + (ts.totalAmount || ts.totalPay || 0);
  }, 0);

  res.json({
    driver: { _id: driver._id, name: driver.name, email: driver.email },
    timesheets: timesheets.map((ts) => ({
      _id: ts._id,
      date: ts.date,
      totalAmount: ts.totalAmount || ts.totalPay || 0,
      weekEnding: ts.weekEnding,
    })),
    totalAmount,
    timesheetCount: timesheets.length,
  });
};

/**
 * POST /api/payments/initiate
 * Admin: Initiate a payout to a driver via Stripe Transfer.
 * Body: { driverId, periodFrom, periodTo, timesheetIds, amountOverride, notes }
 */
const initiatePayout = async (req, res) => {
  const { driverId, periodFrom, periodTo, timesheetIds, amountOverride, notes } = req.body;
  const orgFilter = getOrgFilter(req);

  const driver = await Driver.findOne({ _id: driverId, ...orgFilter });
  if (!driver) return res.status(404).json({ message: "Driver not found" });

  if (!driver.stripeAccountId) {
    return res.status(400).json({
      message: "Driver has not connected their Stripe account. Please complete onboarding first.",
    });
  }
  if (!driver.stripeOnboardingComplete) {
    // Re-check with Stripe in case onboarding was completed recently
    const account = await stripe.accounts.retrieve(driver.stripeAccountId);
    if (!account.charges_enabled || !account.payouts_enabled) {
      return res.status(400).json({
        message: "Driver has not completed Stripe onboarding.",
      });
    }
    await Driver.findByIdAndUpdate(driverId, { stripeOnboardingComplete: true });
  }

  // Calculate amount
  let amountCad = amountOverride;
  let resolvedTimesheetIds = timesheetIds || [];

  if (!amountCad) {
    const dateFilter = {};
    if (periodFrom) dateFilter.$gte = new Date(periodFrom);
    if (periodTo) dateFilter.$lte = new Date(periodTo);

    const timesheetQuery = {
      ...orgFilter,
      driverEmail: driver.email,
      status: "approved",
      ...(resolvedTimesheetIds.length > 0 ? { _id: { $in: resolvedTimesheetIds } } : {}),
      ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
    };
    const timesheets = await Timesheet.find(timesheetQuery).lean();

    resolvedTimesheetIds = timesheets.map((ts) => ts._id);
    amountCad = timesheets.reduce((sum, ts) => sum + (ts.totalAmount || ts.totalPay || 0), 0);
  }

  if (!amountCad || amountCad <= 0) {
    return res.status(400).json({ message: "No payable amount found for the specified period." });
  }

  // Stripe amount is in cents
  const amountCents = Math.round(amountCad * 100);

  // Create a Payment record first (pending)
  const payment = await Payment.create({
    organizationId: req.organizationId,
    driverId: driver._id,
    timesheetIds: resolvedTimesheetIds,
    amount: amountCents,
    currency: "cad",
    status: "processing",
    periodFrom: periodFrom ? new Date(periodFrom) : undefined,
    periodTo: periodTo ? new Date(periodTo) : undefined,
    notes: notes || "",
  });

  try {
    // Create Stripe Transfer to driver's connected account
    const transfer = await stripe.transfers.create({
      amount: amountCents,
      currency: "cad",
      destination: driver.stripeAccountId,
      metadata: {
        paymentId: payment._id.toString(),
        driverId: driver._id.toString(),
        organizationId: req.organizationId?.toString() || "",
      },
    });

    await Payment.findByIdAndUpdate(payment._id, {
      status: "paid",
      stripeTransferId: transfer.id,
      paidAt: new Date(),
    });

    // Notify driver of payment
    const Notification = require("../model/notificationModel");
    Notification.create({
      organizationId: req.organizationId,
      message: `A payment of $${(amountCents / 100).toFixed(2)} CAD has been sent to your account.`,
      email: driver.email,
      field: "payment",
    }).catch(err => console.error("Payment notification failed:", err));

    res.status(201).json({
      message: "Payout initiated successfully.",
      payment: { ...payment.toObject(), stripeTransferId: transfer.id, status: "paid", paidAt: new Date() },
      transferId: transfer.id,
    });
  } catch (stripeError) {
    await Payment.findByIdAndUpdate(payment._id, {
      status: "failed",
      failureReason: stripeError.message,
    });
    res.status(500).json({ message: `Stripe transfer failed: ${stripeError.message}` });
  }
};

/**
 * GET /api/payments
 * Admin: Get all payments for the organization.
 */
const getPaymentHistory = async (req, res) => {
  const orgFilter = getOrgFilter(req);
  const { driverId, status, limit = 50 } = req.query;

  const filter = { ...orgFilter };
  if (driverId) filter.driverId = driverId;
  if (status) filter.status = status;

  const payments = await Payment.find(filter)
    .populate("driverId", "name email")
    .sort({ createdAt: -1 })
    .limit(Number(limit));

  res.json(payments);
};

/**
 * GET /api/payments/my-history
 * Driver: Get own payment history.
 */
const getDriverPaymentHistory = async (req, res) => {
  const orgFilter = getOrgFilter(req);

  // Find driver by user's email (drivers log in as users with role driver)
  const driver = await Driver.findOne({ email: req.user.email, ...orgFilter });
  if (!driver) return res.status(404).json({ message: "Driver record not found" });

  const payments = await Payment.find({ driverId: driver._id })
    .populate("timesheetIds", "date customer category totalHours")
    .sort({ createdAt: -1 });

  res.json(payments);
};

/**
 * POST /api/payments/webhook
 * Stripe webhook handler for payment/transfer events.
 */
const handleWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err.message);
    return res.status(400).json({ message: `Webhook Error: ${err.message}` });
  }

  switch (event.type) {
    case "transfer.created": {
      const transfer = event.data.object;
      const paymentId = transfer.metadata?.paymentId;
      if (paymentId) {
        await Payment.findByIdAndUpdate(paymentId, {
          status: "paid",
          stripeTransferId: transfer.id,
          paidAt: new Date(),
        });
      }
      break;
    }
    case "payout.paid": {
      const payout = event.data.object;
      // Update payment record with payout ID if we can match it
      if (payout.metadata?.paymentId) {
        await Payment.findByIdAndUpdate(payout.metadata.paymentId, {
          stripePayoutId: payout.id,
        });
      }
      break;
    }
    case "transfer.failed": {
      const transfer = event.data.object;
      const paymentId = transfer.metadata?.paymentId;
      if (paymentId) {
        await Payment.findByIdAndUpdate(paymentId, {
          status: "failed",
          failureReason: "Transfer failed",
        });
      }
      break;
    }
    default:
      break;
  }

  res.json({ received: true });
};

module.exports = {
  onboardDriver,
  getOnboardStatus,
  calculatePayout,
  initiatePayout,
  getPaymentHistory,
  getDriverPaymentHistory,
  handleWebhook,
};
