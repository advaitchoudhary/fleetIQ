import User from "../model/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Register a new user
export const register = async (req, res) => {
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
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: "Invalid email or password" });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Invalid email or password" });
        }
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );
        res.json({
            message: "Login successful",
            token,
            user: { name: user.name, email: user.email, role: user.role }
        });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
};

// Logout user
export const logout = (req, res) => {
    res.json({ message: "Logout successful" });
};

// Change Password
export const changePassword = async (req, res) => {
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

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) return res.status(400).json({ error: "Old password is incorrect" });

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.json({ message: "Password changed successfully" });
    } catch (error) {
        console.error("JWT Verification Error:", error); // Log error
        res.status(500).json({ error: "Server error" });
    }
};

// Get User Profile (Protected)
export const getUserProfile = async (req, res) => {
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