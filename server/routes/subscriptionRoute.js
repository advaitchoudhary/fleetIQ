const express = require("express");
const {
  createCheckout,
  getCurrentSubscription,
  createBillingPortal,
  handleWebhook,
} = require("../controller/subscriptionController.js");
const { protect, authorizeRoles } = require("../middleware/authMiddleware.js");

const router = express.Router();

// Stripe webhook — raw body MUST come before express.json middleware
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  handleWebhook
);

// Authenticated routes
router.get("/current", protect, getCurrentSubscription);

router.post(
  "/create-checkout",
  protect,
  authorizeRoles("admin", "company_admin"),
  createCheckout
);

router.post(
  "/create-portal",
  protect,
  authorizeRoles("admin", "company_admin"),
  createBillingPortal
);

module.exports = router;
