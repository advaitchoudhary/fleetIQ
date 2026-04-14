const express = require("express");
const { register, login, getUserProfile, changePassword, switchOrg } = require("../controller/authController.js");
const { protect, authorizeRoles } = require("../middleware/authMiddleware.js");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/profile", protect, getUserProfile);

router.post(
  "/change-password",
  protect,
  authorizeRoles("admin", "company_admin", "dispatcher"),
  changePassword
);

router.post("/switch-org", protect, authorizeRoles("admin"), switchOrg);

router.get("/admin", protect, authorizeRoles("admin"), (req, res) => {
  res.json({ message: "Welcome Admin!" });
});

module.exports = router;