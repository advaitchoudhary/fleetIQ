const FuelLog = require("../model/fuelLogModel.js");
const Vehicle = require("../model/vehicleModel.js");
const asyncHandler = require("express-async-handler");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { getOrgFilter } = require("../middleware/authMiddleware.js");

// ─── Multer for fuel receipts ─────────────────────────────────────────────────
const FUEL_RECEIPTS_DIR = "uploads/fuel-receipts/";
if (!fs.existsSync(FUEL_RECEIPTS_DIR)) {
  fs.mkdirSync(FUEL_RECEIPTS_DIR, { recursive: true });
}

const fuelReceiptStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, FUEL_RECEIPTS_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fuelReceiptFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Only image and PDF files are allowed for receipts"), false);
};

const uploadFuelReceipt = multer({
  storage: fuelReceiptStorage,
  fileFilter: fuelReceiptFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// ─── CRUD ─────────────────────────────────────────────────────────────────────

// GET /api/fuel-logs
const getAllFuelLogs = asyncHandler(async (req, res) => {
  const orgFilter = getOrgFilter(req);
  const { vehicleId, driverId, from, to } = req.query;

  const query = { ...orgFilter };
  if (vehicleId) query.vehicleId = vehicleId;
  if (driverId) query.driverId = driverId;
  if (from || to) {
    query.date = {};
    if (from) query.date.$gte = new Date(from);
    if (to) query.date.$lte = new Date(to);
  }

  const logs = await FuelLog.find(query)
    .populate("vehicleId", "unitNumber make model year")
    .populate("driverId", "name email username")
    .sort({ date: -1 })
    .lean();

  res.json(logs);
});

// GET /api/fuel-logs/stats — fleet-wide fuel summary
const getFuelStats = asyncHandler(async (req, res) => {
  const orgFilter = getOrgFilter(req);
  const { vehicleId, from, to } = req.query;

  const match = { ...orgFilter };
  if (vehicleId) match.vehicleId = require("mongoose").Types.ObjectId(vehicleId);
  if (from || to) {
    match.date = {};
    if (from) match.date.$gte = new Date(from);
    if (to) match.date.$lte = new Date(to);
  }

  const stats = await FuelLog.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$vehicleId",
        totalLitres: { $sum: "$litres" },
        totalCost: { $sum: "$totalCost" },
        fillUps: { $sum: 1 },
        avgPricePerLitre: { $avg: "$pricePerLitre" },
        minOdometer: { $min: "$odometer" },
        maxOdometer: { $max: "$odometer" },
      },
    },
    {
      $lookup: {
        from: "vehicles",
        localField: "_id",
        foreignField: "_id",
        as: "vehicle",
      },
    },
    { $unwind: { path: "$vehicle", preserveNullAndEmpty: true } },
    {
      $project: {
        vehicleId: "$_id",
        unitNumber: "$vehicle.unitNumber",
        make: "$vehicle.make",
        model: "$vehicle.model",
        totalLitres: 1,
        totalCost: 1,
        fillUps: 1,
        avgPricePerLitre: 1,
        totalKm: { $subtract: ["$maxOdometer", "$minOdometer"] },
      },
    },
  ]);

  res.json(stats);
});

// GET /api/fuel-logs/:id
const getFuelLogById = asyncHandler(async (req, res) => {
  const orgFilter = getOrgFilter(req);
  const log = await FuelLog.findOne({ _id: req.params.id, ...orgFilter })
    .populate("vehicleId", "unitNumber make model year")
    .populate("driverId", "name email username")
    .lean();

  if (!log) return res.status(404).json({ message: "Fuel log not found" });
  res.json(log);
});

// POST /api/fuel-logs
const createFuelLog = asyncHandler(async (req, res) => {
  const orgFilter = getOrgFilter(req);

  // Verify vehicle belongs to org
  const vehicle = await Vehicle.findOne({ _id: req.body.vehicleId, ...orgFilter });
  if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

  // Auto-calculate totalCost if not provided
  const litres = parseFloat(req.body.litres) || 0;
  const pricePerLitre = parseFloat(req.body.pricePerLitre) || 0;
  const totalCost = parseFloat(req.body.totalCost) || parseFloat((litres * pricePerLitre).toFixed(2));

  const log = new FuelLog({
    ...req.body,
    organizationId: req.organizationId,
    totalCost,
    receiptPhoto: req.file?.path || null,
    // Drivers log their own fuel-ups
    driverId: req.user.role === "driver" ? req.user.id : (req.body.driverId || null),
  });
  await log.save();

  // Update vehicle odometer if this reading is higher
  if (req.body.odometer && req.body.odometer > vehicle.odometer) {
    await Vehicle.findByIdAndUpdate(req.body.vehicleId, { odometer: req.body.odometer });
  }

  res.status(201).json(log);
});

// PUT /api/fuel-logs/:id
const updateFuelLog = asyncHandler(async (req, res) => {
  const orgFilter = getOrgFilter(req);
  const log = await FuelLog.findOneAndUpdate(
    { _id: req.params.id, ...orgFilter },
    req.body,
    { new: true, runValidators: true }
  );
  if (!log) return res.status(404).json({ message: "Fuel log not found" });
  res.json(log);
});

// DELETE /api/fuel-logs/:id
const deleteFuelLog = asyncHandler(async (req, res) => {
  const orgFilter = getOrgFilter(req);
  const log = await FuelLog.findOneAndDelete({ _id: req.params.id, ...orgFilter });
  if (!log) return res.status(404).json({ message: "Fuel log not found" });

  if (log.receiptPhoto && fs.existsSync(log.receiptPhoto)) fs.unlinkSync(log.receiptPhoto);
  res.json({ message: "Fuel log deleted" });
});

module.exports = {
  getAllFuelLogs,
  getFuelStats,
  getFuelLogById,
  createFuelLog,
  updateFuelLog,
  deleteFuelLog,
  uploadFuelReceipt,
};
