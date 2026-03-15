const Maintenance = require("../model/maintenanceModel.js");
const Vehicle = require("../model/vehicleModel.js");
const asyncHandler = require("express-async-handler");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { getOrgFilter } = require("../middleware/authMiddleware.js");

// ─── Multer for maintenance documents ────────────────────────────────────────
const MAINTENANCE_DOCS_DIR = "uploads/maintenance-docs/";
if (!fs.existsSync(MAINTENANCE_DOCS_DIR)) {
  fs.mkdirSync(MAINTENANCE_DOCS_DIR, { recursive: true });
}

const maintenanceDocStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, MAINTENANCE_DOCS_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const maintenanceDocFilter = (req, file, cb) => {
  const allowed = [
    "image/jpeg", "image/jpg", "image/png",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Only images and documents (PDF, DOC) are allowed"), false);
};

const uploadMaintenanceDocs = multer({
  storage: maintenanceDocStorage,
  fileFilter: maintenanceDocFilter,
  limits: { fileSize: 15 * 1024 * 1024 },
});

// ─── CRUD ─────────────────────────────────────────────────────────────────────

// GET /api/maintenance  (optionally filter by vehicleId, status, type)
const getAllMaintenance = asyncHandler(async (req, res) => {
  const orgFilter = getOrgFilter(req);
  const { vehicleId, status, type } = req.query;

  const query = { ...orgFilter };
  if (vehicleId) query.vehicleId = vehicleId;
  if (status) query.status = status;
  if (type) query.type = type;

  const records = await Maintenance.find(query)
    .populate("vehicleId", "unitNumber make model year")
    .sort({ scheduledDate: -1, createdAt: -1 })
    .lean();

  res.json(records);
});

// GET /api/maintenance/:id
const getMaintenanceById = asyncHandler(async (req, res) => {
  const orgFilter = getOrgFilter(req);
  const record = await Maintenance.findOne({ _id: req.params.id, ...orgFilter })
    .populate("vehicleId", "unitNumber make model year licensePlate")
    .lean();

  if (!record) return res.status(404).json({ message: "Maintenance record not found" });
  res.json(record);
});

// POST /api/maintenance
const createMaintenance = asyncHandler(async (req, res) => {
  const orgFilter = getOrgFilter(req);

  // Verify vehicle belongs to this org
  const vehicle = await Vehicle.findOne({ _id: req.body.vehicleId, ...orgFilter });
  if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

  const record = new Maintenance({
    ...req.body,
    organizationId: req.organizationId,
    documents: req.files?.map((f) => f.path) || [],
  });
  await record.save();

  // If type is maintenance/repair and it's in_progress, update vehicle status
  if (record.status === "in_progress") {
    await Vehicle.findByIdAndUpdate(record.vehicleId, { status: "in_maintenance" });
  }

  res.status(201).json(record);
});

// PUT /api/maintenance/:id
const updateMaintenance = asyncHandler(async (req, res) => {
  const orgFilter = getOrgFilter(req);

  const record = await Maintenance.findOneAndUpdate(
    { _id: req.params.id, ...orgFilter },
    req.body,
    { new: true, runValidators: true }
  );
  if (!record) return res.status(404).json({ message: "Maintenance record not found" });

  // If completed, restore vehicle to active
  if (req.body.status === "completed") {
    await Vehicle.findByIdAndUpdate(record.vehicleId, { status: "active" });
  }
  // If moved back to in_progress, mark vehicle as in maintenance
  if (req.body.status === "in_progress") {
    await Vehicle.findByIdAndUpdate(record.vehicleId, { status: "in_maintenance" });
  }

  res.json(record);
});

// DELETE /api/maintenance/:id
const deleteMaintenance = asyncHandler(async (req, res) => {
  const orgFilter = getOrgFilter(req);
  const record = await Maintenance.findOneAndDelete({ _id: req.params.id, ...orgFilter });
  if (!record) return res.status(404).json({ message: "Maintenance record not found" });

  record.documents?.forEach((p) => {
    if (fs.existsSync(p)) fs.unlinkSync(p);
  });

  res.json({ message: "Maintenance record deleted" });
});

// GET /api/maintenance/due-alerts — records where scheduledDate is within next 14 days
const getDueAlerts = asyncHandler(async (req, res) => {
  const orgFilter = getOrgFilter(req);
  const now = new Date();
  const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const records = await Maintenance.find({
    ...orgFilter,
    status: { $in: ["scheduled"] },
    scheduledDate: { $gte: now, $lte: in14Days },
  })
    .populate("vehicleId", "unitNumber make model")
    .sort({ scheduledDate: 1 })
    .lean();

  res.json(records);
});

module.exports = {
  getAllMaintenance,
  getMaintenanceById,
  createMaintenance,
  updateMaintenance,
  deleteMaintenance,
  getDueAlerts,
  uploadMaintenanceDocs,
};
