const asyncHandler = require("express-async-handler");
const DriverNote = require("../model/driverNoteModel.js");
const User = require("../model/userModel.js");
const { getOrgFilter } = require("../middleware/authMiddleware.js");

// GET /api/drivers/:driverId/notes
const getNotes = asyncHandler(async (req, res) => {
  const { driverId } = req.params;
  const orgFilter = getOrgFilter(req);

  const notes = await DriverNote.find({ driverId, ...orgFilter })
    .sort({ createdAt: -1 })
    .lean();

  res.json(notes);
});

// POST /api/drivers/:driverId/notes
const addNote = asyncHandler(async (req, res) => {
  const { driverId } = req.params;
  const { type, body } = req.body;

  if (!body || !body.trim()) {
    return res.status(400).json({ message: "Note body is required." });
  }

  const orgFilter = getOrgFilter(req);
  const organizationId = req.organizationId;

  // Resolve author name from the User table
  const author = await User.findById(req.user.id).select("name").lean();
  const authorName = author?.name || "Admin";

  const note = await DriverNote.create({
    organizationId,
    driverId,
    authorName,
    type: type || "General",
    body: body.trim(),
  });

  res.status(201).json(note);
});

// DELETE /api/drivers/:driverId/notes/:noteId
const deleteNote = asyncHandler(async (req, res) => {
  const { noteId } = req.params;
  const orgFilter = getOrgFilter(req);

  const note = await DriverNote.findOneAndDelete({ _id: noteId, ...orgFilter });
  if (!note) {
    return res.status(404).json({ message: "Note not found." });
  }

  res.json({ message: "Note deleted." });
});

// GET /api/driver-notes  — all notes for the org, newest first
const getAllOrgNotes = asyncHandler(async (req, res) => {
  const orgFilter = getOrgFilter(req);
  const notes = await DriverNote.find(orgFilter)
    .populate("driverId", "name")
    .sort({ createdAt: -1 })
    .lean();
  res.json(notes);
});

module.exports = { getNotes, addNote, deleteNote, getAllOrgNotes };
