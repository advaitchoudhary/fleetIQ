import express from "express";
import { register, login, getUserProfile } from "../controller/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Authentication Routes
router.post("/register", register); // Register User
router.post("/login", login); // Login User
router.get("/profile", protect, getUserProfile); // Get User Profile (Protected)

export default router;