const Organization = require("../model/organizationModel.js");
const User = require("../model/userModel.js");
const jwt = require("jsonwebtoken");

// POST /api/organizations/register
// Public — any trucking company can sign up.
// Creates an Organization + a company_admin User in one step.
const registerOrganization = async (req, res) => {
  try {
    // Accept both `name` (frontend field) and legacy `companyName`
    const { name, companyName, email, password, phone, address, dotNumber, plan } = req.body;
    const orgName = name || companyName;

    if (!orgName || !email || !password) {
      return res.status(400).json({ error: "name, email and password are required" });
    }

    // Check for duplicate email in both Organization and User collections
    const [existingOrg, existingUser] = await Promise.all([
      Organization.findOne({ email }),
      User.findOne({ email }),
    ]);

    if (existingOrg || existingUser) {
      return res.status(400).json({ error: "An account with this email already exists" });
    }

    // Validate plan; fall back to "bundle" if not provided or invalid
    const validPlans = ["driver", "vehicle", "bundle"];
    const selectedPlan = validPlans.includes(plan) ? plan : "bundle";

    // Create organization first (14-day trial starts automatically via schema default)
    const organization = new Organization({
      name: orgName,
      email,
      phone: phone || "",
      address: address || "",
      dotNumber: dotNumber || "",
      subscription: {
        plan: selectedPlan,
        status: "trialing",
      },
    });
    await organization.save();

    // Create company_admin user — password hashing is handled by the userModel pre-save hook
    const adminUser = new User({
      name: orgName,
      email,
      password,
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
      user: { name: adminUser.name, email: adminUser.email, role: "company_admin", organizationId: organization._id },
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

// GET /api/organizations/mandatory-trainings
const getMandatoryTrainings = async (req, res) => {
  try {
    if (!req.organizationId) {
      return res.status(400).json({ error: "No organization context" });
    }
    const org = await Organization.findById(req.organizationId).select("mandatoryTrainings");
    if (!org) return res.status(404).json({ error: "Organization not found" });
    res.json({ mandatoryTrainings: org.mandatoryTrainings || [] });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// PUT /api/organizations/mandatory-trainings
const updateMandatoryTrainings = async (req, res) => {
  try {
    const { mandatoryTrainings } = req.body;
    if (!Array.isArray(mandatoryTrainings)) {
      return res.status(400).json({ error: "mandatoryTrainings must be an array of strings" });
    }
    const cleaned = mandatoryTrainings.map((t) => String(t).trim()).filter(Boolean);
    const org = await Organization.findByIdAndUpdate(
      req.organizationId,
      { mandatoryTrainings: cleaned },
      { new: true }
    );
    if (!org) return res.status(404).json({ error: "Organization not found" });
    res.json({ mandatoryTrainings: org.mandatoryTrainings });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// GET /api/organizations/mandatory-documents
const getMandatoryDocuments = async (req, res) => {
  try {
    if (!req.organizationId) {
      return res.status(400).json({ error: "No organization context" });
    }
    const org = await Organization.findById(req.organizationId).select("mandatoryDocuments");
    if (!org) return res.status(404).json({ error: "Organization not found" });
    res.json({ mandatoryDocuments: org.mandatoryDocuments || [] });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// PUT /api/organizations/mandatory-documents
const updateMandatoryDocuments = async (req, res) => {
  try {
    const { mandatoryDocuments } = req.body;
    if (!Array.isArray(mandatoryDocuments)) {
      return res.status(400).json({ error: "mandatoryDocuments must be an array of strings" });
    }
    const cleaned = mandatoryDocuments.map((d) => String(d).trim()).filter(Boolean);
    const org = await Organization.findByIdAndUpdate(
      req.organizationId,
      { mandatoryDocuments: cleaned },
      { new: true }
    );
    if (!org) return res.status(404).json({ error: "Organization not found" });
    res.json({ mandatoryDocuments: org.mandatoryDocuments });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  registerOrganization,
  getOrganizationProfile,
  updateOrganizationProfile,
  getAllOrganizations,
  getMandatoryTrainings,
  updateMandatoryTrainings,
  getMandatoryDocuments,
  updateMandatoryDocuments,
};
