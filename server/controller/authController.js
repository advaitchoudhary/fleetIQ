const Driver = require("../model/driverModel.js");
const User = require("../model/userModel.js");
const Organization = require("../model/organizationModel.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { Resend } = require("resend");

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
        // req.user is already set by the `protect` middleware — no need to re-verify the token
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: "User not found" });

        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ error: "oldPassword and newPassword are required" });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ error: "New password must be at least 8 characters" });
        }

        // Verify old password before allowing the change
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Current password is incorrect" });
        }

        // Assign plain text — the userModel pre-save hook hashes it automatically
        user.password = newPassword;
        await user.save();

        res.json({ message: "Password changed successfully" });
    } catch (error) {
        console.error("changePassword error:", error);
        res.status(500).json({ error: "Server error" });
    }
};

// Get User Profile (Protected)
const getUserProfile = async (req, res) => {
    try {
        // req.user is already set by the protect middleware — no need to re-verify the token
        const user = await User.findById(req.user.id).select("-password");

        if (!user) return res.status(404).json({ error: "User not found" });

        res.json({ user });
    } catch (error) {
        console.error("getUserProfile error:", error);
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

// Forgot Password — sends a reset link to the user's email
const forgotPassword = async (req, res) => {
  const GENERIC_MSG = "If that email is registered, a reset link has been sent.";
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      // Don't reveal whether the email exists
      return res.status(200).json({ message: GENERIC_MSG });
    }

    // Generate raw token and store its hash
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const resetUrl = `${clientUrl}/reset-password?token=${rawToken}`;

    // Send email via Resend if configured
    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const fromAddress = process.env.EMAIL_FROM || "FleetIQ <noreply@fleetiq.app>";
        await resend.emails.send({
          from: fromAddress,
          to: user.email,
          subject: "FleetIQ — Reset Your Password",
          html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4F46E5; color: #fff; padding: 24px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 20px; }
    .body { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .warning { background: #fff3cd; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 4px; margin: 16px 0; font-size: 14px; }
    .footer { text-align: center; margin-top: 24px; color: #999; font-size: 11px; }
  </style>
</head>
<body>
  <div class="header"><h1>FleetIQ — Password Reset</h1></div>
  <div class="body">
    <p>Hi ${user.name || user.email},</p>
    <p>We received a request to reset your FleetIQ password. Click the button below to set a new password. This link is valid for <strong>1 hour</strong>.</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${resetUrl}" style="display:inline-block;background:#4F46E5;color:#fff;padding:13px 32px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:15px;">Reset My Password</a>
    </div>
    <div class="warning">If you did not request a password reset, you can safely ignore this email. Your password will not change.</div>
    <p>Or copy and paste this URL into your browser:<br><small>${resetUrl}</small></p>
    <p>Best regards,<br><strong>FleetIQ Team</strong></p>
  </div>
  <div class="footer">This is an automated message. Please do not reply.</div>
</body>
</html>`,
        });
        console.log(`Password reset email sent to ${user.email}`);
      } catch (emailErr) {
        console.warn("Failed to send reset email:", emailErr.message);
        // Don't fail the request — still return 200
      }
    } else {
      console.warn("RESEND_API_KEY not set. Skipping password reset email.");
    }

    return res.status(200).json({ message: GENERIC_MSG });
  } catch (error) {
    console.error("forgotPassword error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Reset Password — validates token and sets a new password
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: "Token and password are required." });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters." });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ error: "Reset link is invalid or has expired." });
    }

    // userModel pre-save hook will hash the password automatically
    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    return res.status(200).json({ message: "Password reset successfully." });
  } catch (error) {
    console.error("resetPassword error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
    register,
    login,
    getUserProfile,
    changePassword,
    switchOrg,
    forgotPassword,
    resetPassword,
};