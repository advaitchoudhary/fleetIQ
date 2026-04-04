const PMTemplate = require("../model/pmTemplateModel.js");
const PMSchedule = require("../model/pmScheduleModel.js");
const Maintenance = require("../model/maintenanceModel.js");
const Vehicle = require("../model/vehicleModel.js");
const asyncHandler = require("express-async-handler");
const { getOrgFilter } = require("../middleware/authMiddleware.js");

// ─── Helper ───────────────────────────────────────────────────────────────────
function recalculateNextDue(schedule, template, vehicleOdometer = null) {
  let nextDueDate = null;
  let nextDueOdometer = null;

  if (schedule.lastCompletedDate && template.intervalDays) {
    nextDueDate = new Date(
      new Date(schedule.lastCompletedDate).getTime() + template.intervalDays * 24 * 60 * 60 * 1000
    );
  }
  if (schedule.lastCompletedOdometer != null && template.intervalKm) {
    nextDueOdometer = schedule.lastCompletedOdometer + template.intervalKm;
  }

  // Determine status based on date
  const now = new Date();
  const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  let status = "on_track";

  if (nextDueDate) {
    if (nextDueDate < now) status = "overdue";
    else if (nextDueDate <= in14Days) status = "due_soon";
  }

  // Override/upgrade status based on odometer if vehicle odometer is known
  if (nextDueOdometer != null && vehicleOdometer != null) {
    if (vehicleOdometer >= nextDueOdometer) {
      status = "overdue";
    } else if (vehicleOdometer >= nextDueOdometer - 1000 && status === "on_track") {
      status = "due_soon";
    }
  }

  return { nextDueDate, nextDueOdometer, status };
}

// ─── Templates ────────────────────────────────────────────────────────────────

// GET /api/pm/templates
const getAllTemplates = asyncHandler(async (req, res) => {
  const orgFilter = getOrgFilter(req);
  const templates = await PMTemplate.find(orgFilter).sort({ name: 1 }).lean();
  res.json(templates);
});

// POST /api/pm/templates
const createTemplate = asyncHandler(async (req, res) => {
  const template = new PMTemplate({ ...req.body, organizationId: req.organizationId });
  await template.save();
  res.status(201).json(template);
});

// PUT /api/pm/templates/:id
const updateTemplate = asyncHandler(async (req, res) => {
  const orgFilter = getOrgFilter(req);
  const template = await PMTemplate.findOneAndUpdate(
    { _id: req.params.id, ...orgFilter },
    req.body,
    { new: true, runValidators: true }
  );
  if (!template) return res.status(404).json({ message: "Template not found" });
  res.json(template);
});

// DELETE /api/pm/templates/:id
const deleteTemplate = asyncHandler(async (req, res) => {
  const orgFilter = getOrgFilter(req);
  const template = await PMTemplate.findOneAndDelete({ _id: req.params.id, ...orgFilter });
  if (!template) return res.status(404).json({ message: "Template not found" });
  res.json({ message: "Template deleted" });
});

// ─── Schedules ────────────────────────────────────────────────────────────────

// GET /api/pm/schedules
const getAllSchedules = asyncHandler(async (req, res) => {
  const orgFilter = getOrgFilter(req);
  const { vehicleId, status } = req.query;

  const query = { ...orgFilter };
  if (vehicleId) query.vehicleId = vehicleId;
  if (status) query.status = status;

  const schedules = await PMSchedule.find(query)
    .populate("vehicleId", "unitNumber make model year odometer")
    .populate("templateId", "name intervalKm intervalDays maintenanceType estimatedCost")
    .sort({ nextDueDate: 1 })
    .lean();

  // Recalculate and persist stale statuses on every fetch
  const now = new Date();
  const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const updates = [];
  for (const s of schedules) {
    let newStatus = "on_track";
    if (s.nextDueDate) {
      if (new Date(s.nextDueDate) < now) newStatus = "overdue";
      else if (new Date(s.nextDueDate) <= in14Days) newStatus = "due_soon";
    }
    const vehicleOdometer = s.vehicleId?.odometer ?? null;
    if (s.nextDueOdometer != null && vehicleOdometer != null) {
      if (vehicleOdometer >= s.nextDueOdometer) {
        newStatus = "overdue";
      } else if (vehicleOdometer >= s.nextDueOdometer - 1000 && newStatus === "on_track") {
        newStatus = "due_soon";
      }
    }
    if (newStatus !== s.status) {
      s.status = newStatus;
      updates.push(PMSchedule.findByIdAndUpdate(s._id, { status: newStatus }));
    }
  }
  if (updates.length) await Promise.all(updates);

  res.json(schedules);
});

// GET /api/pm/schedules/due
const getDueSchedules = asyncHandler(async (req, res) => {
  const orgFilter = getOrgFilter(req);
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const schedules = await PMSchedule.find({
    ...orgFilter,
    isActive: true,
    $or: [
      { status: { $in: ["due_soon", "overdue"] } },
      { nextDueDate: { $lte: in30Days } },
    ],
  })
    .populate("vehicleId", "unitNumber make model year odometer")
    .populate("templateId", "name intervalKm intervalDays maintenanceType estimatedCost")
    .sort({ nextDueDate: 1 })
    .lean();

  res.json(schedules);
});

// POST /api/pm/schedules
const createSchedule = asyncHandler(async (req, res) => {
  const orgFilter = getOrgFilter(req);

  const vehicle = await Vehicle.findOne({ _id: req.body.vehicleId, ...orgFilter });
  if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

  const template = await PMTemplate.findOne({ _id: req.body.templateId, ...orgFilter });
  if (!template) return res.status(404).json({ message: "Template not found" });

  const schedule = new PMSchedule({ ...req.body, organizationId: req.organizationId });
  const { nextDueDate, nextDueOdometer, status } = recalculateNextDue(schedule, template, vehicle.odometer ?? null);
  schedule.nextDueDate = nextDueDate;
  schedule.nextDueOdometer = nextDueOdometer;
  schedule.status = status;

  await schedule.save();
  await schedule.populate([
    { path: "vehicleId", select: "unitNumber make model year" },
    { path: "templateId", select: "name intervalKm intervalDays maintenanceType estimatedCost" },
  ]);

  res.status(201).json(schedule);
});

// PUT /api/pm/schedules/:id
const updateSchedule = asyncHandler(async (req, res) => {
  const orgFilter = getOrgFilter(req);

  let schedule = await PMSchedule.findOne({ _id: req.params.id, ...orgFilter });
  if (!schedule) return res.status(404).json({ message: "Schedule not found" });

  Object.assign(schedule, req.body);

  const template = await PMTemplate.findById(schedule.templateId);
  if (template) {
    const vehicle = await Vehicle.findById(schedule.vehicleId).select("odometer").lean();
    const { nextDueDate, nextDueOdometer, status } = recalculateNextDue(schedule, template, vehicle?.odometer ?? null);
    schedule.nextDueDate = nextDueDate;
    schedule.nextDueOdometer = nextDueOdometer;
    schedule.status = status;
  }

  await schedule.save();
  await schedule.populate([
    { path: "vehicleId", select: "unitNumber make model year" },
    { path: "templateId", select: "name intervalKm intervalDays maintenanceType estimatedCost" },
  ]);

  res.json(schedule);
});

// DELETE /api/pm/schedules/:id
const deleteSchedule = asyncHandler(async (req, res) => {
  const orgFilter = getOrgFilter(req);
  const schedule = await PMSchedule.findOneAndDelete({ _id: req.params.id, ...orgFilter });
  if (!schedule) return res.status(404).json({ message: "Schedule not found" });
  res.json({ message: "Schedule deleted" });
});

// POST /api/pm/schedules/:id/generate
const generateMaintenanceFromSchedule = asyncHandler(async (req, res) => {
  const orgFilter = getOrgFilter(req);

  const schedule = await PMSchedule.findOne({ _id: req.params.id, ...orgFilter })
    .populate("templateId")
    .populate("vehicleId", "unitNumber make model");
  if (!schedule) return res.status(404).json({ message: "Schedule not found" });

  const template = schedule.templateId;

  const maintenance = new Maintenance({
    organizationId: req.organizationId,
    vehicleId: schedule.vehicleId._id,
    type: template.maintenanceType || "preventive",
    title: template.name,
    description: template.description || "",
    status: "scheduled",
    scheduledDate: schedule.nextDueDate || new Date(),
    cost: template.estimatedCost || 0,
    vendor: template.vendor || "",
    notes: `Auto-generated from PM Schedule. ${template.notes || ""}`.trim(),
  });
  await maintenance.save();

  // Link maintenance back to schedule
  schedule.linkedMaintenanceId = maintenance._id;
  await schedule.save();

  res.status(201).json({ maintenance, schedule });
});

module.exports = {
  getAllTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getAllSchedules,
  getDueSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  generateMaintenanceFromSchedule,
};
