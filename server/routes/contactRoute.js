const express = require("express");
const { submitContactForm, getAllContacts } = require("../controller/contactController.js");

const router = express.Router();

router.get("/", getAllContacts);
router.post("/", submitContactForm);

module.exports = router;