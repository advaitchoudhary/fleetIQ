/**
 * Creates the initial platform admin user.
 *
 * Usage (run from /var/www/fleet-management/server):
 *   node scripts/createAdminUser.js
 *
 * Safe to re-run — skips if admin@gmail.com already exists.
 */

require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../model/userModel.js");

async function run() {
  if (!process.env.MONGO_URL) {
    console.error("❌ MONGO_URL not set in .env");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URL, { serverSelectionTimeoutMS: 10000 });
  console.log("✅ Connected to MongoDB");

  const existing = await User.findOne({ email: "admin@gmail.com" });
  if (existing) {
    console.log("ℹ️  admin@gmail.com already exists — skipping");
    await mongoose.disconnect();
    process.exit(0);
  }

  const user = new User({
    name: "Admin",
    email: "admin@gmail.com",
    password: "admin123",
    role: "admin",
  });

  await user.save();
  console.log("✅ Admin user created: admin@gmail.com / admin123");
  console.log("⚠️  Change this password immediately after first login!");

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("❌ Failed:", err);
  mongoose.disconnect();
  process.exit(1);
});
