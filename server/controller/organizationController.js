const Organization = require("../model/organizationModel.js");
const User = require("../model/userModel.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// POST /api/organizations/register
// Public — any trucking company can sign up.
// Creates an Organization + a company_admin User in one step.
const registerOrganization = async (req, res) => {
  try {
    const { companyName, email, password, phone, address, dotNumber, adminName } = req.body;

    if (!companyName || !email || !password || !adminName) {
      return res.status(400).json({ error: "companyName, adminName, email and password are required" });
    }

    // Check for duplicate email in both Organization and User collections
    const [existingOrg, existingUser] = await Promise.all([
      Organization.findOne({ email }),
      User.findOne({ email }),
    ]);

    if (existingOrg || existingUser) {
      return res.status(400).json({ error: "An account with this email already exists" });
    }

    // Create organization first (14-day trial starts automatically via schema default)
    const organization = new Organization({
      name: companyName,
      email,
      phone: phone || "",
      address: address || "",
      dotNumber: dotNumber || "",
    });
    await organization.save();

    // Hash password and create company_admin user
    const hashedPassword = await bcrypt.hash(password, 10);
    const adminUser = new User({
      name: adminName,
      email,
      password: hashedPassword,
      role: "company_admin",
      organizationId: organization._id,
    });
    await adminUser.save();

    // Issue JWT immediately so they can start using the app
    const token = jwt.sign(
      { id: adminUser._id, role: "company_admin", organizationId: organization._id },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.status(201).json({
      message: "Organization registered successfully. 14-day trial started.",
      token,
      user: { name: adminUser.name, email: adminUser.email, role: "company_admin" },
      organization: {
        id: organization._id,
        name: organization.name,
        subscription: organization.subscription,
      },
    });
  } catch (error) {
    console.error("Organization registration error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// GET /api/organizations/profile (protected — company_admin)
const getOrganizationProfile = async (req, res) => {
  try {
    const org = await Organization.findById(req.organizationId);
    if (!org) {
      return res.status(404).json({ error: "Organization not found" });
    }
    res.json(org);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// PUT /api/organizations/profile (protected — company_admin)
const updateOrganizationProfile = async (req, res) => {
  try {
    const { name, phone, address, dotNumber } = req.body;
    const org = await Organization.findByIdAndUpdate(
      req.organizationId,
      { name, phone, address, dotNumber },
      { new: true, runValidators: true }
    );
    if (!org) {
      return res.status(404).json({ error: "Organization not found" });
    }
    res.json({ message: "Organization updated", organization: org });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// GET /api/organizations (super_admin only — list all orgs)
const getAllOrganizations = async (req, res) => {
  try {
    const orgs = await Organization.find().sort({ createdAt: -1 });
    res.json(orgs);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  registerOrganization,
  getOrganizationProfile,
  updateOrganizationProfile,
  getAllOrganizations,
};
