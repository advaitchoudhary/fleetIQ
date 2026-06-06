/**
 * One-time cleanup: drop the driver-payments (Stripe Connect) feature data.
 *
 * - Drops the `payments` collection (Stripe Connect transfer/payout records).
 * - Strips `stripeAccountId` and `stripeOnboardingComplete` from every driver doc.
 *
 * Safe to re-run: drop swallows NamespaceNotFound; $unset is idempotent.
 *
 * Usage:
 *   cd server
 *   node scripts/removePaymentData.js
 */

require("dotenv").config({ path: "../.env" });
const mongoose = require("mongoose");

async function run() {
  const MONGOURL = process.env.MONGO_URL;
  if (!MONGOURL) {
    console.error("❌ MONGO_URL not set in .env");
    process.exit(1);
  }

  await mongoose.connect(MONGOURL);
  const db = mongoose.connection.db;

  try {
    await db.collection("payments").drop();
    console.log("✅ Dropped `payments` collection.");
  } catch (err) {
    if (err.codeName === "NamespaceNotFound" || err.code === 26) {
      console.log("ℹ️  `payments` collection does not exist — nothing to drop.");
    } else {
      throw err;
    }
  }

  const result = await db.collection("drivers").updateMany(
    {},
    { $unset: { stripeAccountId: "", stripeOnboardingComplete: "" } }
  );
  console.log(
    `✅ Stripped Stripe Connect fields from ${result.modifiedCount} / ${result.matchedCount} drivers.`
  );

  await mongoose.disconnect();
  console.log("Done.");
}

run().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
