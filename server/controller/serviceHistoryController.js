const Maintenance = require("../model/maintenanceModel.js");
const Inspection = require("../model/inspectionModel.js");
const FuelLog = require("../model/fuelLogModel.js");
const Vehicle = require("../model/vehicleModel.js");
const asyncHandler = require("express-async-handler");
const { getOrgFilter } = require("../middleware/authMiddleware.js");

// GET /api/service-history/:vehicleId
const getServiceHistory = asyncHandler(async (req, res) => {
  const orgFilter = getOrgFilter(req);
  const { vehicleId } = req.params;
  const { from, to } = req.query;

  const vehicle = await Vehicle.findOne({ _id: vehicleId, ...orgFilter })
    .select("unitNumber make model year odometer licensePlate")
    .lean();
  if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

  const dateFilter = {};
  if (from) dateFilter.$gte = new Date(from);
  if (to) dateFilter.$lte = new Date(to);

  const [maintenanceRecords, inspections, fuelLogs] = await Promise.all([
    Maintenance.find({
      vehicleId,
      ...orgFilter,
      ...(Object.keys(dateFilter).length ? { scheduledDate: dateFilter } : {}),
    })
      .select("type title status completedDate scheduledDate cost vendor odometer notes")
      .sort({ scheduledDate: -1 })
      .lean(),

    Inspection.find({
      vehicleId,
      ...orgFilter,
      ...(Object.keys(dateFilter).length ? { date: dateFilter } : {}),
    })
      .select("type date status odometer mechanicNotes")
      .sort({ date: -1 })
      .lean(),

    FuelLog.find({
      vehicleId,
      ...orgFilter,
      ...(Object.keys(dateFilter).length ? { date: dateFilter } : {}),
    })
      .select("date litres totalCost fuelStation city odometer fuelType")
      .sort({ date: -1 })
      .lean(),
  ]);

  // Normalize into unified events
  const events = [
    ...maintenanceRecords.map((r) => ({
      eventType: "maintenance",
      date: r.completedDate || r.scheduledDate,
      title: r.title,
      detail: r.vendor || "",
      cost: r.cost || 0,
      odometer: r.odometer,
      status: r.status,
      subType: r.type,
      notes: r.notes,
      sourceId: r._id,
    })),
    ...inspections.map((r) => ({
      eventType: "inspection",
      date: r.date,
      title: `${r.type === "pre_trip" ? "Pre-Trip" : r.type === "post_trip" ? "Post-Trip" : "Annual"} Inspection`,
      detail: r.mechanicNotes || "",
      cost: 0,
      odometer: r.odometer,
      status: r.status,
      subType: r.type,
      notes: r.mechanicNotes,
      sourceId: r._id,
    })),
    ...fuelLogs.map((r) => ({
      eventType: "fuel",
      date: r.date,
      title: "Fuel Fill-Up",
      detail: [r.fuelStation, r.city].filter(Boolean).join(", "),
      cost: r.totalCost || 0,
      odometer: r.odometer,
      status: "completed",
      subType: r.fuelType,
      notes: `${r.litres}L @ ${r.fuelType}`,
      sourceId: r._id,
    })),
  ].sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return dateB - dateA;
  });

  const totalMaintenanceCost = maintenanceRecords.reduce((s, r) => s + (r.cost || 0), 0);
  const totalFuelCost = fuelLogs.reduce((s, r) => s + (r.totalCost || 0), 0);

  res.json({
    vehicle,
    events,
    summary: {
      totalMaintenanceCost,
      totalFuelCost,
      totalCost: totalMaintenanceCost + totalFuelCost,
      totalEvents: events.length,
      maintenanceCount: maintenanceRecords.length,
      inspectionCount: inspections.length,
      fuelCount: fuelLogs.length,
    },
  });
});

// GET /api/service-history  — fleet overview (last 5 events per vehicle)
const getAllServiceHistory = asyncHandler(async (req, res) => {
  const orgFilter = getOrgFilter(req);

  const vehicles = await Vehicle.find(orgFilter)
    .select("unitNumber make model year odometer status")
    .lean();

  const summaries = await Promise.all(
    vehicles.map(async (vehicle) => {
      const [lastMaintenance, lastInspection, lastFuel] = await Promise.all([
        Maintenance.findOne({ vehicleId: vehicle._id, ...orgFilter })
          .select("title status scheduledDate completedDate")
          .sort({ scheduledDate: -1 })
          .lean(),
        Inspection.findOne({ vehicleId: vehicle._id, ...orgFilter })
          .select("type date status")
          .sort({ date: -1 })
          .lean(),
        FuelLog.findOne({ vehicleId: vehicle._id, ...orgFilter })
          .select("date totalCost")
          .sort({ date: -1 })
          .lean(),
      ]);

      const totalEvents = await Promise.all([
        Maintenance.countDocuments({ vehicleId: vehicle._id, ...orgFilter }),
        Inspection.countDocuments({ vehicleId: vehicle._id, ...orgFilter }),
        FuelLog.countDocuments({ vehicleId: vehicle._id, ...orgFilter }),
      ]).then(([m, i, f]) => m + i + f);

      return { vehicle, lastMaintenance, lastInspection, lastFuel, totalEvents };
    })
  );

  res.json(summaries);
});

module.exports = { getServiceHistory, getAllServiceHistory };
