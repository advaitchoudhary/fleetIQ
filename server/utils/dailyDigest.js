const Organization = require("../model/organizationModel");
const User = require("../model/userModel");
const Warranty = require("../model/warrantyModel");
const Maintenance = require("../model/maintenanceModel");
const PMSchedule = require("../model/pmScheduleModel");
const Vehicle = require("../model/vehicleModel");
const Driver = require("../model/driverModel");
const Part = require("../model/partModel");
const { sendDailyDigestEmail } = require("./emailService");

const ALL_SECTIONS = [
  "warranties",
  "maintenance_overdue",
  "maintenance_upcoming",
  "pm_overdue",
  "pm_due_soon",
  "insurance",
  "registration",
  "vehicles_oos",
  "driver_licences",
  "parts_low_stock",
];

function getEnabledSections(org) {
  if (org.digestSections && org.digestSections.length > 0) {
    return org.digestSections; // per-org override wins
  }
  const envVal = process.env.DIGEST_DEFAULT_SECTIONS;
  if (envVal && envVal.trim()) {
    return envVal.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return ALL_SECTIONS;
}

async function fetchSections(orgId, enabledSections) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const in10d = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
  const in14d = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const in30d = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const queries = {};

  if (enabledSections.includes("warranties")) {
    queries.warranties = Warranty.find({
      organizationId: orgId,
      status: "active",
      expiryDate: { $gte: now, $lte: in10d },
    })
      .populate("vehicleId", "unitNumber make model")
      .lean();
  }

  if (enabledSections.includes("maintenance_overdue")) {
    queries.maintenance_overdue = Maintenance.find({
      organizationId: orgId,
      status: "scheduled",
      scheduledDate: { $lt: today },
    })
      .populate("vehicleId", "unitNumber make model")
      .lean();
  }

  if (enabledSections.includes("maintenance_upcoming")) {
    queries.maintenance_upcoming = Maintenance.find({
      organizationId: orgId,
      status: "scheduled",
      scheduledDate: { $gte: today, $lte: in14d },
    })
      .populate("vehicleId", "unitNumber make model")
      .lean();
  }

  if (enabledSections.includes("pm_overdue")) {
    queries.pm_overdue = PMSchedule.find({
      organizationId: orgId,
      isActive: true,
      status: "overdue",
    })
      .populate("vehicleId", "unitNumber make model")
      .lean();
  }

  if (enabledSections.includes("pm_due_soon")) {
    queries.pm_due_soon = PMSchedule.find({
      organizationId: orgId,
      isActive: true,
      status: "due_soon",
    })
      .populate("vehicleId", "unitNumber make model")
      .lean();
  }

  if (enabledSections.includes("insurance")) {
    queries.insurance = Vehicle.find({
      organizationId: orgId,
      insuranceExpiry: { $gte: now, $lte: in30d },
    })
      .select("unitNumber make model insuranceExpiry")
      .lean();
  }

  if (enabledSections.includes("registration")) {
    queries.registration = Vehicle.find({
      organizationId: orgId,
      registrationExpiry: { $gte: now, $lte: in30d },
    })
      .select("unitNumber make model registrationExpiry")
      .lean();
  }

  if (enabledSections.includes("vehicles_oos")) {
    queries.vehicles_oos = Vehicle.find({
      organizationId: orgId,
      status: "out_of_service",
    })
      .select("unitNumber make model status")
      .lean();
  }

  if (enabledSections.includes("driver_licences")) {
    queries.driver_licences = Driver.find({
      organizationId: orgId,
      status: "Active",
      licence_expiry_date: { $gte: now, $lte: in30d },
    })
      .select("name email licence_expiry_date")
      .lean();
  }

  if (enabledSections.includes("parts_low_stock")) {
    queries.parts_low_stock = Part.find({
      organizationId: orgId,
      $expr: { $lt: ["$quantity", "$minimumQuantity"] },
    })
      .select("name partNumber quantity minimumQuantity category")
      .lean();
  }

  // Run all enabled queries in parallel
  const keys = Object.keys(queries);
  const results = await Promise.all(keys.map((k) => queries[k]));

  const sections = {};
  keys.forEach((k, i) => {
    sections[k] = results[i];
  });

  return sections;
}

async function runDailyDigest() {
  console.log("[DailyDigest] Starting daily digest run...");

  const orgs = await Organization.find({
    "subscription.status": { $in: ["active", "trialing"] },
  }).lean();

  console.log(`[DailyDigest] Found ${orgs.length} active org(s)`);

  for (const org of orgs) {
    try {
      const admin = await User.findOne({
        organizationId: org._id,
        role: "company_admin",
      }).lean();

      if (!admin) {
        console.log(`[DailyDigest] No company_admin for org ${org.name} — skipping`);
        continue;
      }

      const enabledSections = getEnabledSections(org);
      const sections = await fetchSections(org._id, enabledSections);

      const hasAlerts = Object.values(sections).some((arr) => arr.length > 0);
      if (!hasAlerts) {
        console.log(`[DailyDigest] No alerts for org ${org.name} — skipping email`);
        continue;
      }

      await sendDailyDigestEmail(admin.email, admin.name, org.name, sections);
      console.log(`[DailyDigest] Digest sent to ${admin.email} (${org.name})`);
    } catch (err) {
      console.error(`[DailyDigest] Error processing org ${org.name}:`, err.message);
    }
  }

  console.log("[DailyDigest] Run complete.");
}

module.exports = { runDailyDigest };
