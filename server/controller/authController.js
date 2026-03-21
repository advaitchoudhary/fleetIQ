const Driver = require("../model/driverModel.js");
const User = require("../model/userModel.js");
const Organization = require("../model/organizationModel.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Register a new user
const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "User already exists" });
        }

        // ✅ Just pass plain password, hashing is handled in `userModel.js`
        const newUser = new User({
            name,
            email,
            password,  // No need to hash manually here!
            role: role || "user"
        });

        await newUser.save();

        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({ error: "Server error" });
    }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("🟡 Incoming login request with email:", email);

    // ❌ Prevent drivers from logging in here
    const driverExists = await Driver.findOne({ email });
    if (driverExists) {
      console.log("❌ Driver found with this email, access denied.");
      return res.status(403).json({ error: "Access denied. Driver account detected." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.log("❌ No user found with this email.");
      return res.status(400).json({ error: "Invalid email or password" });
    }

    console.log("✅ User found:", user.email, "with role:", user.role);

    const allowedRoles = ["admin", "company_admin", "dispatcher"];
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: "Access denied. Not an admin user." });
    }
    console.log("🔐 Checking password for user:", user.email);
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }
    console.log("✅ Password matched. Signing token...");

    const token = jwt.sign(
      { id: user._id, role: user.role, organizationId: user.organizationId || null },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.cookie("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 8 * 60 * 60 * 1000, // 8 hours, matches JWT expiry
    });

    res.json({
      message: "Login successful",
      token,
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId || null,
      },
    });
  } catch (error) {
    console.error("🔥 Login Error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Logout user
const logout = (req, res) => {
    res.clearCookie("admin_token");
    res.json({ message: "Logout successful" });
};

// Change Password
const changePassword = async (req, res) => {
    try {
        console.log("Received Headers:", req.headers); // Debug: Log all headers
        const token = req.header("Authorization").split(" ")[1];
        console.log("Extracted Token:", token); // Debug: Log extracted token

        if (!token) return res.status(401).json({ error: "Unauthorized access - No token provided" });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Decoded Token:", decoded); // Debug: Log decoded token

        const user = await User.findById(decoded.id);
        if (!user) return res.status(404).json({ error: "User not found" });

        const { oldPassword, newPassword } = req.body;

        user.password = newPassword;
        await user.save();

        res.json({ message: "Password changed successfully" });
    } catch (error) {
        console.error("JWT Verification Error:", error); // Log error
        res.status(500).json({ error: "Server error" });
    }
};

// Get User Profile (Protected)
const getUserProfile = async (req, res) => {
    try {
        // Extract user ID from JWT
        const token = req.header("Authorization").split(" ")[1];
        if (!token) return res.status(401).json({ error: "Unauthorized access" });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("-password"); // Exclude password

        if (!user) return res.status(404).json({ error: "User not found" });

        res.json({ user });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
};

// Switch org context for super_admin
const switchOrg = async (req, res) => {
  try {
    const { orgId } = req.body;
    const org = await Organization.findById(orgId);
    if (!org) return res.status(404).json({ error: "Organisation not found" });
    const token = jwt.sign(
      { id: req.user.id, role: "admin", organizationId: org._id },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );
    res.json({ token, organization: { _id: org._id, name: org.name } });
  } catch (error) {
    console.error("switchOrg error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
    register,
    login,
    getUserProfile,
    changePassword,
    switchOrg,
};