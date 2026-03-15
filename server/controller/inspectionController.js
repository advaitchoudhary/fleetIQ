const Inspection = require("../model/inspectionModel.js");
const Vehicle = require("../model/vehicleModel.js");
const asyncHandler = require("express-async-handler");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { getOrgFilter } = require("../middleware/authMiddleware.js");

// ─── Default DVIR checklist (FMCSA-aligned) ──────────────────────────────────
const DEFAULT_CHECKLIST = [
  { category: "Brakes", item: "Service brakes" },
  { category: "Brakes", item: "Parking brake" },
  { category: "Steering", item: "Steering mechanism" },
  { category: "Lights", item: "Headlights" },
  { category: "Lights", item: "Tail lights" },
  { category: "Lights", item: "Turn signals" },
  { category: "Lights", item: "Emergency lights/reflectors" },
  { category: "Tires", item: "Front tires" },
  { category: "Tires", item: "Rear tires" },
  { category: "Tires", item: "Spare tire" },
  { category: "Engine", item: "Oil level" },
  { category: "Engine", item: "Coolant level" },
  { category: "Engine", item: "Fuel level" },
  { category: "Body", item: "Windshield & wipers" },
  { category: "Body", item: "Mirrors" },
  { category: "Body", item: "Horn" },
  { category: "Cargo", item: "Cargo securement" },
  { category: "Safety", item: "Fire extinguisher" },
  { category: "Safety", item: "First aid kit" },
  { category: "Safety", item: "Triangles/flares" },
];

// ─── Multer for inspection photos ────────────────────────────────────────────
const INSPECTION_PHOTOS_DIR = "uploads/inspection-photos/";
if (!fs.existsSync(INSPECTION_PHOTOS_DIR)) {
  fs.mkdirSync(INSPECTION_PHOTOS_DIR, { recursive: true });
}

const inspectionPhotoStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, INSPECTION_PHOTOS_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const inspectionPhotoFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Only image files are allowed for inspection photos"), false);
};

const uploadInspectionPhotos = multer({
  storage: inspectionPhotoStorage,
  fileFilter: inspectionPhotoFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

// ─── CRUD ─────────────────────────────────────────────────────────────────────

// GET /api/inspections
const getAllInspections = asyncHandler(async (req, res) => {
  const orgFilter = getOrgFilter(req);
  const { vehicleId, driverId, type, status } = req.query;

  const query = { ...orgFilter };
  if (vehicleId) query.vehicleId = vehicleId;
  if (driverId) query.driverId = driverId;
  if (type) query.type = type;
  if (status) query.status = status;

  const inspections = await Inspection.find(query)
    .populate("vehicleId", "unitNumber make model year")
    .populate("driverId", "name email username")
    .sort({ date: -1 })
    .lean();

  res.json(inspections);
});

// GET /api/inspections/default-checklist
const getDefaultChecklist = asyncHandler(async (req, res) => {
  const checklist = DEFAULT_CHECKLIST.map((item) => ({ ...item, status: "ok", notes: "" }));
  res.json(checklist);
});

// GET /api/inspections/:id
const getInspectionById = asyncHandler(async (req, res) => {
  const orgFilter = getOrgFilter(req);
  const inspection = await Inspection.findOne({ _id: req.params.id, ...orgFilter })
    .populate("vehicleId", "unitNumber make model year licensePlate")
    .populate("driverId", "name email username")
    .lean();

  if (!inspection) return res.status(404).json({ message: "Inspection not found" });
  res.json(inspection);
});

// POST /api/inspections
const createInspection = asyncHandler(async (req, res) => {
  const orgFilter = getOrgFilter(req);

  // Verify vehicle belongs to org
  const vehicle = await Vehicle.findOne({ _id: req.body.vehicleId, ...orgFilter });
  if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

  let checklistItems = req.body.checklistItems;
  if (typeof checklistItems === "string") {
    try { checklistItems = JSON.parse(checklistItems); } catch { checklistItems = []; }
  }
  if (!checklistItems || !checklistItems.length) {
    checklistItems = DEFAULT_CHECKLIST.map((item) => ({ ...item, status: "ok" }));
  }

  // Derive overall status from checklist
  const hasDefects = checklistItems.some((i) => i.status === "defect");
  const overallStatus = req.body.status || (hasDefects ? "defects_noted" : "satisfactory");

  // If out of service, update vehicle status
  if (overallStatus === "out_of_service") {
    await Vehicle.findByIdAndUpdate(req.body.vehicleId, { status: "out_of_service" });
  }

  const inspection = new Inspection({
    ...req.body,
    organizationId: req.organizationId,
    checklistItems,
    status: overallStatus,
    photos: req.files?.map((f) => f.path) || [],
    // Drivers can only submit their own inspections
    driverId: req.user.role === "driver" ? req.user.id : (req.body.driverId || req.user.id),
  });
  await inspection.save();

  await inspection.populate("vehicleId", "unitNumber make model year");
  await inspection.populate("driverId", "name email");
  res.status(201).json(inspection);
});

// PUT /api/inspections/:id  (admin adds mechanic notes / signature)
const updateInspection = asyncHandler(async (req, res) => {
  const orgFilter = getOrgFilter(req);
  const inspection = await Inspection.findOneAndUpdate(
    { _id: req.params.id, ...orgFilter },
    req.body,
    { new: true, runValidators: true }
  );
  if (!inspection) return res.status(404).json({ message: "Inspection not found" });
  res.json(inspection);
});

// DELETE /api/inspections/:id
const deleteInspection = asyncHandler(async (req, res) => {
  const orgFilter = getOrgFilter(req);
  const inspection = await Inspection.findOneAndDelete({ _id: req.params.id, ...orgFilter });
  if (!inspection) return res.status(404).json({ message: "Inspection not found" });

  inspection.photos?.forEach((p) => { if (fs.existsSync(p)) fs.unlinkSync(p); });
  res.json({ message: "Inspection deleted" });
});

module.exports = {
  getAllInspections,
  getDefaultChecklist,
  getInspectionById,
  createInspection,
  updateInspection,
  deleteInspection,
  uploadInspectionPhotos,
};
