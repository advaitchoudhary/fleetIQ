import express from "express";
import { register, login, getUserProfile, changePassword } from "../controller/authController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/profile", protect, getUserProfile);
// router.post(
//     "/change-password",
//     protect,
//     authorizeRoles("driver", "admin"), // ← include roles that are allowed
//     changePasswordController
//   );

// Example of restricting access to admin only
router.get("/admin", protect, authorizeRoles("admin"), (req, res) => {
    res.json({ message: "Welcome Admin!" });
});

export default router;