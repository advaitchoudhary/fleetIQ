const express = require("express");
const { submitContactForm, getAllContacts } = require("../controller/contactController.js");
const { protect, authorizeRoles, softAuth } = require("../middleware/authMiddleware.js");

const router = express.Router();

// GET is restricted to admin roles
router.get("/", protect, authorizeRoles("admin", "company_admin", "dispatcher"), getAllContacts);
// POST is public; softAuth attaches organizationId when the submitter is logged in
router.post("/", softAuth, submitContactForm);

module.exports = router;
