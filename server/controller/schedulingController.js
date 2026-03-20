const Maintenance = require("../model/maintenanceModel.js");
const PMSchedule = require("../model/pmScheduleModel.js");
const Vehicle = require("../model/vehicleModel.js");
const asyncHandler = require("express-async-handler");
const { getOrgFilter } = require("../middleware/authMiddleware.js");

// GET /api/scheduling/calendar?month=&year=
const getCalendarEvents = asyncHandler(async (req, res) => {
  const orgFilter = getOrgFilter(req);
  const now = new Date();
  const month = parseInt(req.query.month ?? now.getMonth() + 1);
  const year = parseInt(req.query.year ?? now.getFullYear());

  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59);

  const [maintenanceRecords, pmSchedules] = await Promise.all([
    Maintenance.find({
      ...orgFilter,
      status: { $in: ["scheduled", "in_progress"] },
      scheduledDate: { $gte: startOfMonth, $lte: endOfMonth },
    })
      .populate("vehicleId", "unitNumber make model")
      .select("title type status scheduledDate vehicleId")
      .lean(),

    PMSchedule.find({
      ...orgFilter,
      isActive: true,
      nextDueDate: { $gte: startOfMonth, $lte: endOfMonth },
    })
      .populate("vehicleId", "unitNumber make model")
      .populate("templateId", "name maintenanceType")
      .select("status nextDueDate vehicleId templateId")
      .lean(),
  ]);

  const events = [
    ...maintenanceRecords.map((r) => ({
      date: r.scheduledDate,
      type: "maintenance",
      title: `${r.title} — ${r.vehicleId?.unitNumber || ""}`,
      vehicleId: r.vehicleId?._id,
      sourceId: r._id,
      status: r.status,
      color: "#4F46E5",
    })),
    ...pmSchedules.map((r) => ({
      date: r.nextDueDate,
      type: "pm_due",
      title: `${r.templateId?.name || "PM Due"} — ${r.vehicleId?.unitNumber || ""}`,
      vehicleId: r.vehicleId?._id,
      sourceId: r._id,
      status: r.status,
      color: r.status === "overdue" ? "#dc2626" : "#f59e0b",
    })),
  ].sort((a, b) => new Date(a.date) - new Date(b.date));

  res.json(events);
});

// GET /api/scheduling/upcoming?days=30
const getUpcomingEvents = asyncHandler(async (req, res) => {
  const orgFilter = getOrgFilter(req);
  const days = parseInt(req.query.days) || 30;
  const now = new Date();
  const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const [maintenanceRecords, pmSchedules] = await Promise.all([
    Maintenance.find({
      ...orgFilter,
      status: { $in: ["scheduled", "in_progress"] },
      scheduledDate: { $gte: now, $lte: future },
    })
      .populate("vehicleId", "unitNumber make model")
      .select("title type status scheduledDate vehicleId")
      .sort({ scheduledDate: 1 })
      .lean(),

    PMSchedule.find({
      ...orgFilter,
      isActive: true,
      nextDueDate: { $gte: now, $lte: future },
    })
      .populate("vehicleId", "unitNumber make model")
      .populate("templateId", "name")
      .select("status nextDueDate vehicleId templateId")
      .sort({ nextDueDate: 1 })
      .lean(),
  ]);

  const events = [
    ...maintenanceRecords.map((r) => ({
      date: r.scheduledDate,
      type: "maintenance",
      title: r.title,
      vehicle: r.vehicleId,
      sourceId: r._id,
      status: r.status,
      color: "#4F46E5",
    })),
    ...pmSchedules.map((r) => ({
      date: r.nextDueDate,
      type: "pm_due",
      title: r.templateId?.name || "PM Due",
      vehicle: r.vehicleId,
      sourceId: r._id,
      status: r.status,
      color: r.status === "overdue" ? "#dc2626" : "#f59e0b",
    })),
  ].sort((a, b) => new Date(a.date) - new Date(b.date));

  res.json(events);
});

// POST /api/scheduling/events — schedule a maintenance record
const scheduleMaintenanceEvent = asyncHandler(async (req, res) => {
  const orgFilter = getOrgFilter(req);

  const vehicle = await Vehicle.findOne({ _id: req.body.vehicleId, ...orgFilter });
  if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

  const maintenance = new Maintenance({
    ...req.body,
    organizationId: req.organizationId,
    status: "scheduled",
  });
  await maintenance.save();
  res.status(201).json(maintenance);
});

module.exports = { getCalendarEvents, getUpcomingEvents, scheduleMaintenanceEvent };
