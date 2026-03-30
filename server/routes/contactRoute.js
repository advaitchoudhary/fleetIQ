const express = require("express");
const { submitContactForm, getAllContacts } = require("../controller/contactController.js");
const { protect, authorizeRoles } = require("../middleware/authMiddleware.js");

const router = express.Router();

// GET is restricted to admin and company_admin to prevent public data exposure
router.get("/", protect, authorizeRoles("admin", "company_admin", "dispatcher"), getAllContacts);
// POST is public so drivers and visitors can submit the contact form
router.post("/", submitContactForm);

module.exports = router;