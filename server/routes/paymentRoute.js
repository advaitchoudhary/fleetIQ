const express = require("express");
const bodyParser = require("body-parser");
const {
  onboardDriver,
  getOnboardStatus,
  calculatePayout,
  initiatePayout,
  getPaymentHistory,
  getDriverPaymentHistory,
  handleWebhook,
} = require("../controller/paymentController.js");
const { protect, authorizeRoles } = require("../middleware/authMiddleware.js");
const { requireDriverModule } = require("../middleware/featureGate.js");

const router = express.Router();
const jsonParser = bodyParser.json();

// Stripe webhook — must use raw body; express.raw() here takes precedence over
// any global bodyParser.json() middleware, so this is safe regardless of mount order.
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  handleWebhook
);

// Admin: driver Stripe Connect onboarding
router.post(
  "/onboard/:driverId",
  jsonParser,
  protect,
  authorizeRoles("admin", "company_admin"),
  requireDriverModule,
  onboardDriver
);

router.get(
  "/onboard-status/:driverId",
  protect,
  authorizeRoles("admin", "company_admin"),
  requireDriverModule,
  getOnboardStatus
);

// Admin: calculate and initiate payouts
router.post(
  "/calculate",
  jsonParser,
  protect,
  authorizeRoles("admin", "company_admin"),
  requireDriverModule,
  calculatePayout
);

router.post(
  "/initiate",
  jsonParser,
  protect,
  authorizeRoles("admin", "company_admin"),
  requireDriverModule,
  initiatePayout
);

// Admin: payment history
router.get(
  "/",
  protect,
  authorizeRoles("admin", "company_admin", "dispatcher"),
  requireDriverModule,
  getPaymentHistory
);

// Driver: own payment history
router.get(
  "/my-history",
  protect,
  authorizeRoles("driver"),
  requireDriverModule,
  getDriverPaymentHistory
);

module.exports = router;
