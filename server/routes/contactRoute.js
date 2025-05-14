const express = require("express");
const { submitContactForm, getAllContacts } = require("../controller/contactController.js");

const router = express.Router();

router.post("/contact", submitContactForm);
router.get("/contact", getAllContacts);

module.exports = router;