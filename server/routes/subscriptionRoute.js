const express = require("express");
const bodyParser = require("body-parser");
const {
  createCheckout,
  getCurrentSubscription,
  createBillingPortal,
  handleWebhook,
} = require("../controller/subscriptionController.js");
const { protect, authorizeRoles } = require("../middleware/authMiddleware.js");

const router = express.Router();
const jsonParser = bodyParser.json();

// Stripe webhook — must use raw body; express.raw() here takes precedence over
// any global bodyParser.json() middleware, so this is safe regardless of mount order.
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  handleWebhook
);

// Authenticated routes — jsonParser applied per-route so these work even though
// the router is mounted before the global bodyParser.json() in index.ts.
router.get("/current", protect, getCurrentSubscription);

router.post(
  "/create-checkout",
  jsonParser,
  protect,
  authorizeRoles("admin", "company_admin"),
  createCheckout
);

router.post(
  "/create-portal",
  jsonParser,
  protect,
  authorizeRoles("admin", "company_admin"),
  createBillingPortal
);

module.exports = router;
