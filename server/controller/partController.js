const Part = require("../model/partModel.js");
const Vehicle = require("../model/vehicleModel.js");
const asyncHandler = require("express-async-handler");
const { getOrgFilter } = require("../middleware/authMiddleware.js");

// GET /api/parts
const getAllParts = asyncHandler(async (req, res) => {
  const orgFilter = getOrgFilter(req);
  const { category, lowStock } = req.query;

  const query = { ...orgFilter };
  if (category) query.category = category;
  if (lowStock === "true") query.$expr = { $lte: ["$quantity", "$minimumQuantity"] };

  const parts = await Part.find(query)
    .populate("compatibleVehicles", "unitNumber make model")
    .sort({ name: 1 })
    .lean();

  res.json(parts);
});

// GET /api/parts/low-stock
const getLowStockAlerts = asyncHandler(async (req, res) => {
  const orgFilter = getOrgFilter(req);

  const parts = await Part.find({
    ...orgFilter,
    minimumQuantity: { $gt: 0 },
    $expr: { $lte: ["$quantity", "$minimumQuantity"] },
  })
    .sort({ quantity: 1 })
    .lean();

  res.json(parts);
});

// GET /api/parts/:id
const getPartById = asyncHandler(async (req, res) => {
  const orgFilter = getOrgFilter(req);
  const part = await Part.findOne({ _id: req.params.id, ...orgFilter })
    .populate("compatibleVehicles", "unitNumber make model year")
    .populate("usageHistory.vehicleId", "unitNumber make model")
    .populate("usageHistory.maintenanceId", "title type scheduledDate")
    .lean();

  if (!part) return res.status(404).json({ message: "Part not found" });
  res.json(part);
});

// POST /api/parts
const createPart = asyncHandler(async (req, res) => {
  const orgFilter = getOrgFilter(req);

  const part = new Part({
    ...req.body,
    organizationId: req.organizationId,
  });
  await part.save();
  res.status(201).json(part);
});

// PUT /api/parts/:id
const updatePart = asyncHandler(async (req, res) => {
  const orgFilter = getOrgFilter(req);

  const part = await Part.findOneAndUpdate(
    { _id: req.params.id, ...orgFilter },
    req.body,
    { new: true, runValidators: true }
  );
  if (!part) return res.status(404).json({ message: "Part not found" });
  res.json(part);
});

// DELETE /api/parts/:id
const deletePart = asyncHandler(async (req, res) => {
  const orgFilter = getOrgFilter(req);
  const part = await Part.findOneAndDelete({ _id: req.params.id, ...orgFilter });
  if (!part) return res.status(404).json({ message: "Part not found" });
  res.json({ message: "Part deleted" });
});

// POST /api/parts/:id/use
const usePart = asyncHandler(async (req, res) => {
  const orgFilter = getOrgFilter(req);
  const { vehicleId, maintenanceId, quantityUsed, notes } = req.body;

  if (!quantityUsed || quantityUsed <= 0) {
    return res.status(400).json({ message: "quantityUsed must be greater than 0" });
  }

  // Atomically decrement quantity only if sufficient stock exists
  const part = await Part.findOneAndUpdate(
    { _id: req.params.id, ...orgFilter, quantity: { $gte: quantityUsed } },
    {
      $inc: { quantity: -quantityUsed },
      $push: {
        usageHistory: {
          vehicleId: vehicleId || null,
          maintenanceId: maintenanceId || null,
          quantityUsed,
          usedAt: new Date(),
          notes: notes || "",
        },
      },
    },
    { new: true }
  );

  if (!part) {
    // Check if part exists at all vs insufficient stock
    const exists = await Part.findOne({ _id: req.params.id, ...orgFilter });
    if (!exists) return res.status(404).json({ message: "Part not found" });
    return res.status(400).json({ message: "Insufficient stock" });
  }

  res.json(part);
});

module.exports = {
  getAllParts,
  getLowStockAlerts,
  getPartById,
  createPart,
  updatePart,
  deletePart,
  usePart,
};
