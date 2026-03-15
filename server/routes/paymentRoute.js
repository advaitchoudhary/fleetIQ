const express = require("express");
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

const router = express.Router();

// Stripe webhook — must use raw body, registered BEFORE express.json
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  handleWebhook
);

// Admin: driver Stripe Connect onboarding
router.post(
  "/onboard/:driverId",
  protect,
  authorizeRoles("admin", "company_admin"),
  onboardDriver
);

router.get(
  "/onboard-status/:driverId",
  protect,
  authorizeRoles("admin", "company_admin"),
  getOnboardStatus
);

// Admin: calculate and initiate payouts
router.post(
  "/calculate",
  protect,
  authorizeRoles("admin", "company_admin"),
  calculatePayout
);

router.post(
  "/initiate",
  protect,
  authorizeRoles("admin", "company_admin"),
  initiatePayout
);

// Admin: payment history
router.get(
  "/",
  protect,
  authorizeRoles("admin", "company_admin", "dispatcher"),
  getPaymentHistory
);

// Driver: own payment history
router.get(
  "/my-history",
  protect,
  authorizeRoles("driver"),
  getDriverPaymentHistory
);

module.exports = router;
