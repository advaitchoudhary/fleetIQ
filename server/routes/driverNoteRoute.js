const express = require("express");
const { getNotes, addNote, deleteNote } = require("../controller/driverNoteController.js");
const { protect, authorizeRoles } = require("../middleware/authMiddleware.js");
const { requireDriverModule } = require("../middleware/featureGate.js");

const router = express.Router({ mergeParams: true }); // mergeParams to access :driverId

router.get(   "/", protect, authorizeRoles("admin", "company_admin", "dispatcher"), requireDriverModule, getNotes);
router.post(  "/", protect, authorizeRoles("admin", "company_admin"),               requireDriverModule, addNote);
router.delete("/:noteId", protect, authorizeRoles("admin", "company_admin"),        requireDriverModule, deleteNote);

module.exports = router;
