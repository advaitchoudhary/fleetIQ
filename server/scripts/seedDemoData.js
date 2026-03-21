/**
 * Seed script: Insert demo vehicles, maintenance records, and warranties into MongoDB.
 *
 * Usage:
 *   cd server
 *   node scripts/seedDemoData.js
 *
 * Safe to re-run — skips documents that already exist.
 * Only inserts; never deletes or modifies existing data.
 */

require("dotenv").config({ path: "./.env" });
const mongoose = require("mongoose");

const Organization = require("../model/organizationModel.js");
const Vehicle = require("../model/vehicleModel.js");
const Maintenance = require("../model/maintenanceModel.js");
const Warranty = require("../model/warrantyModel.js");
const Part = require("../model/partModel.js");

// ---------------------------------------------------------------------------
// Source data (mirrors DEMO_* constants from the frontend pages)
// ---------------------------------------------------------------------------

const VEHICLES = [
  {
    unitNumber: "U-101",
    make: "Kenworth",
    model: "T680",
    year: 2022,
    vin: "1XKYD49X5NJ123456",
    licensePlate: "ON-TRK-101",
    type: "truck",
    status: "active",
    odometer: 156340,
    ownership: "owned",
    fuelType: "diesel",
    insuranceExpiry: new Date("2026-08-15"),
    registrationExpiry: new Date("2026-06-30"),
    notes: "Primary long-haul unit. Runs Windsor–Toronto corridor.",
  },
  {
    unitNumber: "U-102",
    make: "Freightliner",
    model: "Cascadia",
    year: 2021,
    vin: "1FUJGLDR4MLHX2390",
    licensePlate: "ON-TRK-102",
    type: "truck",
    status: "in_maintenance",
    odometer: 204780,
    ownership: "owned",
    fuelType: "diesel",
    insuranceExpiry: new Date("2026-09-20"),
    registrationExpiry: new Date("2026-07-15"),
    notes: "Brake service in progress. Grounded until complete.",
  },
  {
    unitNumber: "U-103",
    make: "Ford",
    model: "Transit 350",
    year: 2023,
    vin: "1FTBR1Y80PKA44321",
    licensePlate: "ON-VAN-103",
    type: "van",
    status: "active",
    odometer: 34560,
    ownership: "leased",
    fuelType: "gasoline",
    insuranceExpiry: new Date("2026-12-01"),
    registrationExpiry: new Date("2026-11-30"),
    notes: "City delivery van. Leased through Ford Fleet.",
  },
  {
    unitNumber: "U-104",
    make: "Utility",
    model: "4000D-X 53'",
    year: 2020,
    vin: "1UYVS2539LU842107",
    licensePlate: "ON-TRL-104",
    type: "trailer",
    status: "active",
    odometer: 0,
    ownership: "owned",
    fuelType: "other",
    insuranceExpiry: new Date("2026-10-05"),
    registrationExpiry: new Date("2026-09-30"),
    notes: "Refrigerated dry van trailer. Pool use.",
  },
  {
    unitNumber: "U-105",
    make: "Ram",
    model: "1500 Classic",
    year: 2022,
    vin: "1C6RR7FT4NS152836",
    licensePlate: "ON-PCK-105",
    type: "pickup",
    status: "active",
    odometer: 67890,
    ownership: "owned",
    fuelType: "gasoline",
    insuranceExpiry: new Date("2026-07-25"),
    registrationExpiry: new Date("2026-06-15"),
    notes: "Supervisor / site inspection truck.",
  },
];

// unitNumber is a temporary key used only to resolve the vehicleId below
const MAINTENANCE = [
  {
    unitNumber: "U-101",
    type: "oil_change",
    title: "Engine Oil & Filter Change",
    description: "15W-40 Rotella T6, 10L. Replaced oil filter and drained sump.",
    status: "completed",
    scheduledDate: new Date("2026-02-10"),
    completedDate: new Date("2026-02-10"),
    odometer: 155000,
    cost: 185,
    vendor: "FleetPro Service Centre",
    notes: "",
  },
  {
    unitNumber: "U-102",
    type: "corrective",
    title: "Front Brake Pad Replacement",
    description: "Worn front brake pads detected during pre-trip. Replaced with OEM pads.",
    status: "in_progress",
    scheduledDate: new Date("2026-03-18"),
    odometer: 204780,
    cost: 540,
    vendor: "TruckStop Auto",
    notes: "Parts ordered — vehicle grounded until complete.",
  },
  {
    unitNumber: "U-101",
    type: "preventive",
    title: "Annual Safety Inspection (CVIP)",
    description: "MTO mandated annual commercial vehicle inspection.",
    status: "scheduled",
    scheduledDate: new Date("2026-04-05"),
    odometer: 156340,
    cost: 250,
    vendor: "Certified Truck Inspections Ltd.",
    notes: "",
  },
  {
    unitNumber: "U-103",
    type: "tire",
    title: "Tire Rotation & Balance",
    description: "Rotate all 4 tires front-to-rear and dynamic balance.",
    status: "scheduled",
    scheduledDate: new Date("2026-04-12"),
    odometer: 34560,
    cost: 120,
    vendor: "Kal Tire",
    notes: "",
  },
  {
    unitNumber: "U-102",
    type: "preventive",
    title: "Coolant System Flush",
    description: "Full coolant drain and refill with OAT extended-life coolant.",
    status: "completed",
    scheduledDate: new Date("2026-01-20"),
    completedDate: new Date("2026-01-22"),
    odometer: 198400,
    cost: 320,
    vendor: "FleetPro Service Centre",
    notes: "Also topped up windshield washer fluid.",
  },
  {
    unitNumber: "U-105",
    type: "inspection",
    title: "Post-Incident Inspection",
    description:
      "Minor fender contact in parking lot. Inspected frame, lights, and bumper. No structural damage found.",
    status: "completed",
    scheduledDate: new Date("2026-03-02"),
    completedDate: new Date("2026-03-02"),
    odometer: 67890,
    cost: 0,
    vendor: "Internal",
    notes: "Photos on file. Insurance claim not required.",
  },
];

// compatibleVehicles uses unitNumbers — resolved to ObjectIds during seeding
const PARTS = [
  {
    name: "Engine Oil Filter",
    partNumber: "OF-5293",
    category: "filters",
    description: "Spin-on oil filter for Detroit DD15 and PACCAR MX-13 engines.",
    quantity: 12,
    minimumQuantity: 3,
    unitCost: 8.99,
    supplier: "FleetParts Canada",
    location: "Shelf A-2",
    compatibleVehicles: ["U-101", "U-102"],
    notes: "Order in batches of 12.",
  },
  {
    name: "Front Brake Pads (Axle Set)",
    partNumber: "BP-1047",
    category: "brakes",
    description: "OEM-spec front brake pad set for Class 8 trucks.",
    quantity: 6,
    minimumQuantity: 4,
    unitCost: 45.00,
    supplier: "TruckStop Auto",
    location: "Shelf B-1",
    compatibleVehicles: ["U-101", "U-102"],
    notes: "Replace in axle sets only.",
  },
  {
    name: "Air Filter (Primary)",
    partNumber: "AF-8831",
    category: "filters",
    description: "Primary air filter element for Kenworth and Freightliner cab-over filters.",
    quantity: 5,
    minimumQuantity: 2,
    unitCost: 22.50,
    supplier: "FleetParts Canada",
    location: "Shelf A-3",
    compatibleVehicles: ["U-101", "U-102"],
    notes: "",
  },
  {
    name: "275/70R22.5 Drive Tire",
    partNumber: "TI-2272",
    category: "tires",
    description: "Michelin X Line Energy D2 all-position drive tire.",
    quantity: 4,
    minimumQuantity: 2,
    unitCost: 380.00,
    supplier: "Kal Tire Commercial",
    location: "Tire Bay",
    compatibleVehicles: ["U-101", "U-102"],
    notes: "Check tread depth at 200k km intervals.",
  },
  {
    name: 'Windshield Wiper Blade 26"',
    partNumber: "WB-2600",
    category: "body",
    description: '26" beam-style wiper blade for Kenworth and Freightliner.',
    quantity: 2,
    minimumQuantity: 4,
    unitCost: 14.00,
    supplier: "AutoValue",
    location: "Shelf C-1",
    compatibleVehicles: ["U-101", "U-102", "U-103"],
    notes: "REORDER — stock below minimum.",
  },
  {
    name: "DEF Fluid 2.5 Gal",
    partNumber: "DF-2500",
    category: "fluids",
    description: "Diesel Exhaust Fluid (ISO 22241) for SCR emission systems.",
    quantity: 14,
    minimumQuantity: 5,
    unitCost: 18.00,
    supplier: "Petro-Canada Fleet",
    location: "Fluid Rack",
    compatibleVehicles: ["U-101", "U-102"],
    notes: "Top up at every other fuel stop.",
  },
];

const WARRANTIES = [
  {
    unitNumber: "U-101",
    title: "Kenworth T680 Factory Powertrain Warranty",
    type: "manufacturer",
    provider: "Kenworth Truck Co.",
    policyNumber: "KW-2022-789456",
    startDate: new Date("2022-05-01"),
    expiryDate: new Date("2027-05-01"),
    mileageLimit: 500000,
    currentMileage: 156340,
    coverageDetails:
      "Covers engine, transmission, drive axles, and frame. Excludes wear items and driver abuse. Claims processed via authorized Kenworth dealer network.",
    status: "active",
    claims: [],
  },
  {
    unitNumber: "U-102",
    title: "Freightliner Extended Service Agreement",
    type: "extended",
    provider: "Daimler Trucks NA",
    policyNumber: "FTL-ESA-334871",
    startDate: new Date("2021-03-15"),
    expiryDate: new Date("2026-03-15"),
    mileageLimit: 600000,
    currentMileage: 204780,
    coverageDetails:
      "Covers all OEM-specified major components including fuel system, electrical, cooling, and drivetrain. $500 deductible applies per approved claim. Roadside assistance included.",
    status: "active",
    claims: [
      {
        claimDate: new Date("2025-11-10"),
        description:
          "Faulty DPF sensor triggered limp mode at highway speed. Unit towed to authorized dealer for diagnosis and repair.",
        claimAmount: 1850,
        approvedAmount: 1350,
        claimNumber: "CLM-2025-0044",
        status: "approved",
        notes: "$500 deductible applied. Repair completed in 2 business days.",
      },
    ],
  },
  {
    unitNumber: "U-101",
    title: "Rear Drive Axle Component Warranty",
    type: "part",
    provider: "Meritor Inc.",
    policyNumber: "MER-AX-662109",
    startDate: new Date("2022-05-01"),
    expiryDate: new Date("2026-04-10"),
    mileageLimit: 300000,
    currentMileage: 156340,
    coverageDetails:
      "Covers ring & pinion gears, differential housing, bearing cups and cones, and wheel-end assemblies. Does not cover lubricant-related failures or improper load ratings.",
    status: "active",
    claims: [],
  },
  {
    unitNumber: "U-103",
    title: "Ford Transit Bumper-to-Bumper Coverage",
    type: "manufacturer",
    provider: "Ford Motor Company",
    policyNumber: "FORD-B2B-T350-441",
    startDate: new Date("2023-02-01"),
    expiryDate: new Date("2026-02-01"),
    mileageLimit: 60000,
    currentMileage: 34560,
    coverageDetails:
      "Full factory bumper-to-bumper coverage for 3 years or 60,000 km, whichever comes first. Includes roadside assistance, towing, and rental reimbursement. Claim at any authorized Ford dealer.",
    status: "expired",
    claims: [],
  },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const MONGO_URL = process.env.MONGO_URL;
  if (!MONGO_URL) {
    console.error("❌ MONGO_URL not set in .env");
    process.exit(1);
  }

  console.log("🔌 Connecting to MongoDB...");
  await mongoose.connect(MONGO_URL);
  console.log("✅ Connected");

  // 1. Find organisation
  const org = await Organization.findOne({ email: "kbemployment1@gmail.com" });
  if (!org) {
    console.error(
      '❌ Organisation "Premier Choice Employment" not found. Run migrateToMultiTenant.js first.'
    );
    await mongoose.disconnect();
    process.exit(1);
  }
  const orgId = org._id;
  console.log(`✅ Organisation found: ${org.name} (${orgId})`);

  // 2. Upsert vehicles and build unitNumber → ObjectId map
  console.log("\n🚛 Seeding vehicles...");
  const vehicleMap = {};
  for (const v of VEHICLES) {
    const { unitNumber, ...fields } = v;
    const doc = await Vehicle.findOneAndUpdate(
      { organizationId: orgId, unitNumber },
      { $setOnInsert: { ...fields, unitNumber, organizationId: orgId } },
      { upsert: true, new: true }
    );
    vehicleMap[unitNumber] = doc._id;
    console.log(`  ${doc.__v === undefined ? "✅ inserted" : "⏭  exists  "} ${unitNumber} — ${v.make} ${v.model}`);
  }

  // 3. Upsert maintenance records
  console.log("\n🔧 Seeding maintenance records...");
  for (const m of MAINTENANCE) {
    const { unitNumber, ...fields } = m;
    const vehicleId = vehicleMap[unitNumber];
    const exists = await Maintenance.findOne({ organizationId: orgId, vehicleId, title: m.title });
    if (exists) {
      console.log(`  ⏭  exists   ${m.title}`);
    } else {
      await Maintenance.create({ ...fields, organizationId: orgId, vehicleId });
      console.log(`  ✅ inserted ${m.title}`);
    }
  }

  // 4. Upsert warranties
  console.log("\n🛡️  Seeding warranties...");
  for (const w of WARRANTIES) {
    const { unitNumber, ...fields } = w;
    const vehicleId = vehicleMap[unitNumber];
    const exists = await Warranty.findOne({ organizationId: orgId, vehicleId, title: w.title });
    if (exists) {
      console.log(`  ⏭  exists   ${w.title}`);
    } else {
      await Warranty.create({ ...fields, organizationId: orgId, vehicleId });
      console.log(`  ✅ inserted ${w.title}`);
    }
  }

  // 5. Upsert parts (skip if exists by name+orgId)
  console.log("\n📦 Seeding parts...");
  for (const p of PARTS) {
    const { compatibleVehicles: unitNumbers, ...fields } = p;
    const compatibleVehicles = unitNumbers.map((u) => vehicleMap[u]).filter(Boolean);
    const exists = await Part.findOne({ organizationId: orgId, name: p.name });
    if (exists) {
      console.log(`  ⏭  exists   ${p.name}`);
    } else {
      await Part.create({ ...fields, organizationId: orgId, compatibleVehicles });
      console.log(`  ✅ inserted ${p.name}`);
    }
  }

  await mongoose.disconnect();
  console.log("\n✅ Done. MongoDB disconnected.");
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
