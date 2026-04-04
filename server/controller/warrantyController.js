const Warranty = require("../model/warrantyModel.js");
const Vehicle = require("../model/vehicleModel.js");
const asyncHandler = require("express-async-handler");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { getOrgFilter } = require("../middleware/authMiddleware.js");

// ─── Multer ───────────────────────────────────────────────────────────────────
const WARRANTY_DOCS_DIR = "uploads/warranty-docs/";
if (!fs.existsSync(WARRANTY_DOCS_DIR)) {
  fs.mkdirSync(WARRANTY_DOCS_DIR, { recursive: true });
}

const warrantyDocStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, WARRANTY_DOCS_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const warrantyDocFilter = (req, file, cb) => {
  const allowed = [
    "image/jpeg", "image/jpg", "image/png",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Only images and documents (PDF, DOC) are allowed"), false);
};

const uploadWarrantyDocs = multer({
  storage: warrantyDocStorage,
  fileFilter: warrantyDocFilter,
  limits: { fileSize: 15 * 1024 * 1024 },
});

// ─── CRUD ─────────────────────────────────────────────────────────────────────

// GET /api/warranties
const getAllWarranties = asyncHandler(async (req, res) => {
  const orgFilter = getOrgFilter(req);
  const { vehicleId, status } = req.query;

  // Auto-expire any active warranties whose expiry date has passed
  await Warranty.updateMany(
    { ...orgFilter, status: "active", expiryDate: { $lt: new Date() } },
    { $set: { status: "expired" } }
  );

  const query = { ...orgFilter };
  if (vehicleId) query.vehicleId = vehicleId;
  if (status) query.status = status;

  const warranties = await Warranty.find(query)
    .populate("vehicleId", "unitNumber make model year")
    .sort({ expiryDate: 1 })
    .lean();

  res.json(warranties);
});

// GET /api/warranties/expiry-alerts
const getExpiryAlerts = asyncHandler(async (req, res) => {
  const orgFilter = getOrgFilter(req);
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const warranties = await Warranty.find({
    ...orgFilter,
    status: "active",
    expiryDate: { $gte: now, $lte: in30Days },
  })
    .populate("vehicleId", "unitNumber make model")
    .sort({ expiryDate: 1 })
    .lean();

  res.json(warranties);
});

// GET /api/warranties/:id
const getWarrantyById = asyncHandler(async (req, res) => {
  const orgFilter = getOrgFilter(req);
  const warranty = await Warranty.findOne({ _id: req.params.id, ...orgFilter })
    .populate("vehicleId", "unitNumber make model year licensePlate")
    .lean();

  if (!warranty) return res.status(404).json({ message: "Warranty not found" });
  res.json(warranty);
});

// POST /api/warranties
const createWarranty = asyncHandler(async (req, res) => {
  const orgFilter = getOrgFilter(req);

  const vehicle = await Vehicle.findOne({ _id: req.body.vehicleId, ...orgFilter });
  if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

  const warranty = new Warranty({
    ...req.body,
    organizationId: req.organizationId,
    documents: req.files?.map((f) => f.path) || [],
  });
  await warranty.save();
  res.status(201).json(warranty);
});

// PUT /api/warranties/:id
const updateWarranty = asyncHandler(async (req, res) => {
  const orgFilter = getOrgFilter(req);

  const warranty = await Warranty.findOneAndUpdate(
    { _id: req.params.id, ...orgFilter },
    req.body,
    { new: true, runValidators: true }
  );
  if (!warranty) return res.status(404).json({ message: "Warranty not found" });
  res.json(warranty);
});

// DELETE /api/warranties/:id
const deleteWarranty = asyncHandler(async (req, res) => {
  const orgFilter = getOrgFilter(req);
  const warranty = await Warranty.findOneAndDelete({ _id: req.params.id, ...orgFilter });
  if (!warranty) return res.status(404).json({ message: "Warranty not found" });

  warranty.documents?.forEach((p) => {
    if (fs.existsSync(p)) fs.unlinkSync(p);
  });

  res.json({ message: "Warranty deleted" });
});

// POST /api/warranties/:id/claims
const addClaim = asyncHandler(async (req, res) => {
  const orgFilter = getOrgFilter(req);
  const { claimDate, description, claimAmount, claimNumber, notes } = req.body;

  const warranty = await Warranty.findOneAndUpdate(
    { _id: req.params.id, ...orgFilter },
    {
      $push: {
        claims: {
          claimDate: claimDate || new Date(),
          description,
          claimAmount: claimAmount || 0,
          approvedAmount: 0,
          status: "submitted",
          claimNumber: claimNumber || "",
          notes: notes || "",
        },
      },
    },
    { new: true, runValidators: true }
  ).populate("vehicleId", "unitNumber make model year");

  if (!warranty) return res.status(404).json({ message: "Warranty not found" });
  res.json(warranty);
});

// PUT /api/warranties/:id/claims/:claimId
const updateClaim = asyncHandler(async (req, res) => {
  const orgFilter = getOrgFilter(req);
  const { claimId } = req.params;

  // Build a $set that only updates the provided fields on the matched subdocument
  // to avoid overwriting fields not included in req.body (e.g. documents).
  const setFields = {};
  const allowedClaimFields = ["claimDate", "description", "claimAmount", "approvedAmount", "status", "claimNumber", "notes"];
  allowedClaimFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      setFields[`claims.$.${field}`] = req.body[field];
    }
  });

  const warranty = await Warranty.findOneAndUpdate(
    { _id: req.params.id, ...orgFilter, "claims._id": claimId },
    { $set: setFields },
    { new: true }
  ).populate("vehicleId", "unitNumber make model year");

  if (!warranty) return res.status(404).json({ message: "Warranty or claim not found" });
  res.json(warranty);
});

module.exports = {
  getAllWarranties,
  getExpiryAlerts,
  getWarrantyById,
  createWarranty,
  updateWarranty,
  deleteWarranty,
  addClaim,
  updateClaim,
  uploadWarrantyDocs,
};
