const express = require("express");
const { chat } = require("../controller/chatController.js");
const { protect } = require("../middleware/authMiddleware.js");

const router = express.Router();

router.post("/", protect, chat);

module.exports = router;
