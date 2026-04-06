const Maintenance = require("../model/maintenanceModel.js");
const FuelLog = require("../model/fuelLogModel.js");
const Vehicle = require("../model/vehicleModel.js");
const asyncHandler = require("express-async-handler");
const { getOrgFilter } = require("../middleware/authMiddleware.js");
const mongoose = require("mongoose");

// GET /api/costs/summary?from=&to=&vehicleId=
const getCostSummary = asyncHandler(async (req, res) => {
  const orgFilter = getOrgFilter(req);
  const aggOrgFilter = orgFilter.organizationId
    ? { organizationId: new mongoose.Types.ObjectId(orgFilter.organizationId) }
    : {};
  const { from, to, vehicleId } = req.query;

  const dateFilter = {};
  if (from) dateFilter.$gte = new Date(from);
  if (to) dateFilter.$lte = new Date(to);

  const maintenanceMatch = { ...aggOrgFilter, status: "completed" };
  const fuelMatch = { ...aggOrgFilter };
  if (Object.keys(dateFilter).length) {
    maintenanceMatch.completedDate = dateFilter;
    fuelMatch.date = dateFilter;
  }
  if (vehicleId) {
    maintenanceMatch.vehicleId = new mongoose.Types.ObjectId(vehicleId);
    fuelMatch.vehicleId = new mongoose.Types.ObjectId(vehicleId);
  }

  const [maintenanceCosts, fuelCosts, vehicles] = await Promise.all([
    Maintenance.aggregate([
      { $match: maintenanceMatch },
      {
        $group: {
          _id: "$vehicleId",
          maintenanceCost: { $sum: "$cost" },
          jobCount: { $sum: 1 },
        },
      },
    ]),
    FuelLog.aggregate([
      { $match: fuelMatch },
      {
        $group: {
          _id: "$vehicleId",
          fuelCost: { $sum: "$totalCost" },
          litres: { $sum: "$litres" },
          fillCount: { $sum: 1 },
        },
      },
    ]),
    Vehicle.find(orgFilter).select("unitNumber make model year odometer").lean(),
  ]);

  // Merge by vehicleId
  const vehicleMap = {};
  vehicles.forEach((v) => { vehicleMap[v._id.toString()] = { ...v }; });

  const merged = {};
  maintenanceCosts.forEach(({ _id, maintenanceCost, jobCount }) => {
    const key = _id?.toString();
    if (!merged[key]) merged[key] = { vehicleId: key, maintenanceCost: 0, fuelCost: 0, jobCount: 0, litres: 0, fillCount: 0 };
    merged[key].maintenanceCost = maintenanceCost;
    merged[key].jobCount = jobCount;
  });
  fuelCosts.forEach(({ _id, fuelCost, litres, fillCount }) => {
    const key = _id?.toString();
    if (!merged[key]) merged[key] = { vehicleId: key, maintenanceCost: 0, fuelCost: 0, jobCount: 0, litres: 0, fillCount: 0 };
    merged[key].fuelCost = fuelCost;
    merged[key].litres = litres;
    merged[key].fillCount = fillCount;
  });

  const rows = Object.values(merged).map((row) => ({
    ...row,
    vehicle: vehicleMap[row.vehicleId] || null,
    totalCost: (row.maintenanceCost || 0) + (row.fuelCost || 0),
  })).sort((a, b) => b.totalCost - a.totalCost);

  const totals = rows.reduce(
    (acc, r) => ({
      maintenanceCost: acc.maintenanceCost + r.maintenanceCost,
      fuelCost: acc.fuelCost + r.fuelCost,
      totalCost: acc.totalCost + r.totalCost,
      jobCount: acc.jobCount + r.jobCount,
      litres: acc.litres + r.litres,
    }),
    { maintenanceCost: 0, fuelCost: 0, totalCost: 0, jobCount: 0, litres: 0 }
  );

  res.json({ rows, totals, vehicleCount: vehicles.length });
});

// GET /api/costs/trend?vehicleId=&months=6
const getCostTrend = asyncHandler(async (req, res) => {
  const orgFilter = getOrgFilter(req);
  const aggOrgFilter = orgFilter.organizationId
    ? { organizationId: new mongoose.Types.ObjectId(orgFilter.organizationId) }
    : {};
  const months = parseInt(req.query.months) || 6;
  const { vehicleId } = req.query;

  const since = new Date();
  since.setMonth(since.getMonth() - months + 1);
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const maintenanceMatch = { ...aggOrgFilter, status: "completed", completedDate: { $gte: since } };
  const fuelMatch = { ...aggOrgFilter, date: { $gte: since } };
  if (vehicleId) {
    maintenanceMatch.vehicleId = new mongoose.Types.ObjectId(vehicleId);
    fuelMatch.vehicleId = new mongoose.Types.ObjectId(vehicleId);
  }

  const [maintenanceTrend, fuelTrend] = await Promise.all([
    Maintenance.aggregate([
      { $match: maintenanceMatch },
      {
        $group: {
          _id: { year: { $year: "$completedDate" }, month: { $month: "$completedDate" } },
          maintenanceCost: { $sum: "$cost" },
          jobCount: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),
    FuelLog.aggregate([
      { $match: fuelMatch },
      {
        $group: {
          _id: { year: { $year: "$date" }, month: { $month: "$date" } },
          fuelCost: { $sum: "$totalCost" },
          litres: { $sum: "$litres" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),
  ]);

  // Build month labels for last N months
  const monthLabels = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    monthLabels.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
  }

  const mMap = {};
  maintenanceTrend.forEach(({ _id, maintenanceCost, jobCount }) => {
    mMap[`${_id.year}-${_id.month}`] = { maintenanceCost, jobCount };
  });
  const fMap = {};
  fuelTrend.forEach(({ _id, fuelCost, litres }) => {
    fMap[`${_id.year}-${_id.month}`] = { fuelCost, litres };
  });

  const trend = monthLabels.map(({ year, month }) => {
    const key = `${year}-${month}`;
    const m = mMap[key] || { maintenanceCost: 0, jobCount: 0 };
    const f = fMap[key] || { fuelCost: 0, litres: 0 };
    return {
      year,
      month,
      label: new Date(year, month - 1).toLocaleString("default", { month: "short", year: "2-digit" }),
      maintenanceCost: m.maintenanceCost,
      fuelCost: f.fuelCost,
      totalCost: m.maintenanceCost + f.fuelCost,
      jobCount: m.jobCount,
      litres: f.litres,
    };
  });

  res.json(trend);
});

// GET /api/costs/by-category?from=&to=
const getCostByCategory = asyncHandler(async (req, res) => {
  const orgFilter = getOrgFilter(req);
  const aggOrgFilter = orgFilter.organizationId
    ? { organizationId: new mongoose.Types.ObjectId(orgFilter.organizationId) }
    : {};
  const { from, to } = req.query;

  const match = { ...aggOrgFilter, status: "completed" };
  if (from || to) {
    match.completedDate = {};
    if (from) match.completedDate.$gte = new Date(from);
    if (to) match.completedDate.$lte = new Date(to);
  }

  const result = await Maintenance.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$type",
        totalCost: { $sum: "$cost" },
        count: { $sum: 1 },
      },
    },
    { $sort: { totalCost: -1 } },
  ]);

  res.json(result);
});

module.exports = { getCostSummary, getCostTrend, getCostByCategory };
