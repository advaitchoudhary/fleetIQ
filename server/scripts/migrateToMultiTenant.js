/**
 * One-time migration script: Multi-Tenancy Foundation
 *
 * Run ONCE after deploying the multi-tenancy changes to assign all existing
 * data (drivers, timesheets, applications, dispatches, notifications) to the
 * default "Premier Choice Employment" organization.
 *
 * Usage:
 *   cd server
 *   node scripts/migrateToMultiTenant.js
 *
 * Safe to re-run — skips documents that already have an organizationId set.
 */

require("dotenv").config({ path: "../.env" });
const mongoose = require("mongoose");

const Organization = require("../model/organizationModel.js");
const User = require("../model/userModel.js");
const Driver = require("../model/driverModel.js");
const Timesheet = require("../model/timesheetModel.js");
const DriverApplication = require("../model/driverApplicationModel.js");
const Dispatch = require("../model/uploadModel.js");
const Notification = require("../model/notificationModel.js");

const DEFAULT_ORG = {
  name: "Premier Choice Employment",
  email: "kbemployment1@gmail.com",
  phone: "",
  address: "",
  dotNumber: "",
};

async function run() {
  const MONGOURL = process.env.MONGO_URL;
  if (!MONGOURL) {
    console.error("❌ MONGO_URL not set in .env");
    process.exit(1);
  }

  await mongoose.connect(MONGOURL, { serverSelectionTimeoutMS: 10000 });
  console.log("✅ Connected to MongoDB");

  // 1. Find or create the default organization
  let org = await Organization.findOne({ email: DEFAULT_ORG.email });
  if (!org) {
    org = await Organization.create({
      ...DEFAULT_ORG,
      subscription: { plan: "bundle", status: "active" },
    });
    console.log(`✅ Created default organization: ${org.name} (${org._id})`);
  } else {
    console.log(`ℹ️  Default organization already exists: ${org.name} (${org._id})`);
  }

  const orgId = org._id;

  // 2. Update existing admin users that have no organizationId
  const userResult = await User.updateMany(
    { organizationId: null, role: { $in: ["admin", "user"] } },
    { $set: { organizationId: orgId, role: "company_admin" } }
  );
  console.log(`✅ Users updated: ${userResult.modifiedCount}`);

  // 3. Update drivers
  const driverResult = await Driver.updateMany(
    { organizationId: null },
    { $set: { organizationId: orgId } }
  );
  console.log(`✅ Drivers updated: ${driverResult.modifiedCount}`);

  // 4. Update timesheets
  const timesheetResult = await Timesheet.updateMany(
    { organizationId: null },
    { $set: { organizationId: orgId } }
  );
  console.log(`✅ Timesheets updated: ${timesheetResult.modifiedCount}`);

  // 5. Update driver applications
  const appResult = await DriverApplication.updateMany(
    { organizationId: null },
    { $set: { organizationId: orgId } }
  );
  console.log(`✅ Driver applications updated: ${appResult.modifiedCount}`);

  // 6. Update dispatch records
  const dispatchResult = await Dispatch.updateMany(
    { organizationId: null },
    { $set: { organizationId: orgId } }
  );
  console.log(`✅ Dispatch records updated: ${dispatchResult.modifiedCount}`);

  // 7. Update notifications
  const notifResult = await Notification.updateMany(
    { organizationId: null },
    { $set: { organizationId: orgId } }
  );
  console.log(`✅ Notifications updated: ${notifResult.modifiedCount}`);

  console.log("\n🎉 Migration complete. All existing data is now scoped to the default organization.");
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("❌ Migration failed:", err);
  mongoose.disconnect();
  process.exit(1);
});
