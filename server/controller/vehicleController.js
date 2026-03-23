const Vehicle = require("../model/vehicleModel.js");
const Driver = require("../model/driverModel.js");
const asyncHandler = require("express-async-handler");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { getOrgFilter } = require("../middleware/authMiddleware.js");

// ─── Multer for vehicle photos ───────────────────────────────────────────────
const VEHICLE_PHOTOS_DIR = "uploads/vehicle-photos/";
if (!fs.existsSync(VEHICLE_PHOTOS_DIR)) {
  fs.mkdirSync(VEHICLE_PHOTOS_DIR, { recursive: true });
}

const vehiclePhotoStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, VEHICLE_PHOTOS_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const vehiclePhotoFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Only JPEG, PNG, and WEBP images are allowed"), false);
};

const uploadVehiclePhotos = multer({
  storage: vehiclePhotoStorage,
  fileFilter: vehiclePhotoFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// ─── CRUD ─────────────────────────────────────────────────────────────────────

// GET /api/vehicles
const getAllVehicles = asyncHandler(async (req, res) => {
  const orgFilter = getOrgFilter(req);
  const { status, type, search } = req.query;

  const query = { ...orgFilter };
  if (status) query.status = status;
  if (type) query.type = type;
  if (search) {
    const re = { $regex: search, $options: "i" };
    query.$or = [{ unitNumber: re }, { make: re }, { model: re }, { licensePlate: re }, { vin: re }];
  }

  const vehicles = await Vehicle.find(query)
    .populate("assignedDriverId", "name email username")
    .sort({ createdAt: -1 })
    .lean();

  res.json(vehicles);
});

// GET /api/vehicles/:id
const getVehicleById = asyncHandler(async (req, res) => {
  const orgFilter = getOrgFilter(req);
  const vehicle = await Vehicle.findOne({ _id: req.params.id, ...orgFilter })
    .populate("assignedDriverId", "name email username")
    .lean();

  if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });
  res.json(vehicle);
});

// POST /api/vehicles
const createVehicle = asyncHandler(async (req, res) => {
  const orgFilter = getOrgFilter(req);

  // Non-admin users must have an org context
  if (!req.organizationId && req.user?.role !== "admin") {
    return res.status(400).json({ message: "Organization context required" });
  }

  if (!req.body.unitNumber?.trim()) {
    return res.status(400).json({ message: "Unit number is required" });
  }

  // Enforce unique unitNumber within org
  const existing = await Vehicle.findOne({ unitNumber: req.body.unitNumber, ...orgFilter });
  if (existing) {
    return res.status(400).json({ message: `Unit number "${req.body.unitNumber}" already exists` });
  }

  // Strip any client-supplied organizationId to prevent spoofing
  const { organizationId: _ignored, ...safeBody } = req.body;

  const vehicle = new Vehicle({
    ...safeBody,
    organizationId: req.organizationId,
    photos: req.files?.map((f) => f.path) || [],
  });
  await vehicle.save();

  res.status(201).json(vehicle);
});

// PUT /api/vehicles/:id
const updateVehicle = asyncHandler(async (req, res) => {
  const orgFilter = getOrgFilter(req);

  // Strip organizationId and _id from the update payload to prevent spoofing
  const { organizationId: _org, _id: _id, ...safeBody } = req.body;

  const vehicle = await Vehicle.findOneAndUpdate(
    { _id: req.params.id, ...orgFilter },
    { $set: safeBody },
    { new: true, runValidators: true }
  );
  if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });
  res.json(vehicle);
});

// DELETE /api/vehicles/:id
const deleteVehicle = asyncHandler(async (req, res) => {
  const orgFilter = getOrgFilter(req);
  const vehicle = await Vehicle.findOneAndDelete({ _id: req.params.id, ...orgFilter });
  if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

  // Clean up photos from disk
  vehicle.photos?.forEach((p) => {
    if (fs.existsSync(p)) fs.unlinkSync(p);
  });

  res.json({ message: "Vehicle deleted successfully" });
});

// POST /api/vehicles/:id/assign-driver
const assignDriver = asyncHandler(async (req, res) => {
  const orgFilter = getOrgFilter(req);
  const { driverId } = req.body;

  const vehicle = await Vehicle.findOne({ _id: req.params.id, ...orgFilter });
  if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

  if (driverId) {
    const driver = await Driver.findOne({ _id: driverId, ...orgFilter });
    if (!driver) return res.status(404).json({ message: "Driver not found" });
    vehicle.assignedDriverId = driverId;
  } else {
    vehicle.assignedDriverId = null; // unassign
  }

  await vehicle.save();
  await vehicle.populate("assignedDriverId", "name email username");
  res.json({ message: "Driver assignment updated", vehicle });
});

// GET /api/vehicles/:id/stats — cost-per-km, fuel economy
const getVehicleStats = asyncHandler(async (req, res) => {
  const orgFilter = getOrgFilter(req);
  const vehicle = await Vehicle.findOne({ _id: req.params.id, ...orgFilter });
  if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

  const FuelLog = require("../model/fuelLogModel.js");
  const Maintenance = require("../model/maintenanceModel.js");

  const [fuelLogs, maintenanceRecords] = await Promise.all([
    FuelLog.find({ vehicleId: req.params.id, ...orgFilter }).lean(),
    Maintenance.find({ vehicleId: req.params.id, ...orgFilter, status: "completed" }).lean(),
  ]);

  const totalFuelCost = fuelLogs.reduce((s, f) => s + (f.totalCost || 0), 0);
  const totalLitres = fuelLogs.reduce((s, f) => s + (f.litres || 0), 0);
  const totalMaintenanceCost = maintenanceRecords.reduce((s, m) => s + (m.cost || 0), 0);

  // Estimate total km from fuel log odometer range
  const odometerReadings = fuelLogs.map((f) => f.odometer).filter(Boolean).sort((a, b) => a - b);
  const totalKm = odometerReadings.length >= 2
    ? odometerReadings[odometerReadings.length - 1] - odometerReadings[0]
    : 0;

  const fuelEconomy = totalKm > 0 ? (totalLitres / totalKm * 100).toFixed(2) : null; // L/100km
  const costPerKm = totalKm > 0 ? ((totalFuelCost + totalMaintenanceCost) / totalKm).toFixed(4) : null;

  res.json({
    totalFuelCost: totalFuelCost.toFixed(2),
    totalLitres: totalLitres.toFixed(2),
    totalMaintenanceCost: totalMaintenanceCost.toFixed(2),
    totalKm,
    fuelEconomyPer100km: fuelEconomy,
    costPerKm,
    fuelLogCount: fuelLogs.length,
    maintenanceCount: maintenanceRecords.length,
  });
});

module.exports = {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  assignDriver,
  getVehicleStats,
  uploadVehiclePhotos,
};
