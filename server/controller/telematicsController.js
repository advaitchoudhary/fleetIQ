const TelematicsDevice = require("../model/telematicsDeviceModel");
const Organization = require("../model/organizationModel");
const { encrypt, decrypt } = require("../utils/credentialCrypto");
const geotabClient = require("../utils/geotabClient");
const samsaraClient = require("../utils/samsaraClient");
const { getOrgFilter } = require("../middleware/authMiddleware");

const testConnection = async (req, res) => {
  try {
    const { provider, credentials } = req.body;
    if (!provider || !credentials) return res.status(400).json({ message: "provider and credentials are required" });
    if (provider === "geotab") {
      await geotabClient.authenticate(credentials);
    } else if (provider === "samsara") {
      await samsaraClient.testConnection(credentials.apiToken);
    } else {
      return res.status(400).json({ message: "Invalid provider" });
    }
    res.json({ success: true, message: "Connection successful" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const pairDevice = async (req, res) => {
  try {
    const { vehicleId, provider, deviceSerial, credentials } = req.body;
    const organizationId = req.organizationId;
    if (!vehicleId || !provider || !deviceSerial || !credentials)
      return res.status(400).json({ message: "vehicleId, provider, deviceSerial, credentials are required" });

    // Test connection before saving
    if (provider === "geotab") {
      await geotabClient.authenticate(credentials);
    } else if (provider === "samsara") {
      await samsaraClient.testConnection(credentials.apiToken);
    } else {
      return res.status(400).json({ message: "Invalid provider" });
    }

    const encryptedCredentials = encrypt(credentials);
    const device = await TelematicsDevice.findOneAndUpdate(
      { organizationId, vehicleId },
      { organizationId, vehicleId, provider, deviceSerial, credentials: encryptedCredentials, isActive: true, lastError: null },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Update org integration type
    await Organization.findByIdAndUpdate(organizationId, { integrationType: provider });

    res.status(201).json({ message: "Device paired successfully", deviceId: device._id });
  } catch (err) {
    console.error("pairDevice error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

const getOrgDevices = async (req, res) => {
  try {
    const orgFilter = getOrgFilter(req);
    const devices = await TelematicsDevice.find({ ...orgFilter, isActive: true })
      .populate("vehicleId", "unitNumber make model")
      .select("-credentials") // never expose encrypted credentials
      .lean();
    res.json(devices);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

const unpairDevice = async (req, res) => {
  try {
    const { id } = req.params;
    const orgFilter = getOrgFilter(req);
    await TelematicsDevice.findOneAndUpdate({ _id: id, ...orgFilter }, { isActive: false });
    res.json({ message: "Device unpaired" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

const syncNow = async (req, res) => {
  try {
    const { id } = req.params;
    const orgFilter = getOrgFilter(req);
    const device = await TelematicsDevice.findOne({ _id: id, ...orgFilter }).lean();
    if (!device) return res.status(404).json({ message: "Device not found" });

    const { pollAllDevices } = require("../utils/telematicsAdapter");
    await pollAllDevices();
    res.json({ message: "Sync triggered" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Discover available hardware devices from provider (read-only, nothing saved)
const discoverDevices = async (req, res) => {
  try {
    const { provider, credentials } = req.body;
    if (!provider || !credentials) return res.status(400).json({ message: "provider and credentials are required" });
    let devices = [];
    if (provider === "geotab") {
      devices = await geotabClient.listDevices(credentials);
    } else if (provider === "samsara") {
      devices = await samsaraClient.listVehicles(credentials.apiToken);
    } else {
      return res.status(400).json({ message: "Invalid provider" });
    }
    res.json({ devices });
  } catch (err) {
    res.status(400).json({ message: err.message || "Discovery failed" });
  }
};

// Bulk pair: one set of credentials, N vehicle→device mappings
const bulkPair = async (req, res) => {
  try {
    const { provider, credentials, mappings } = req.body;
    const organizationId = req.organizationId;
    if (!provider || !credentials || !Array.isArray(mappings) || mappings.length === 0)
      return res.status(400).json({ message: "provider, credentials, and mappings[] are required" });

    // Verify credentials once before saving anything
    if (provider === "geotab") {
      await geotabClient.authenticate(credentials);
    } else if (provider === "samsara") {
      await samsaraClient.testConnection(credentials.apiToken);
    } else {
      return res.status(400).json({ message: "Invalid provider" });
    }

    const encryptedCredentials = encrypt(credentials);
    const errors = [];
    let paired = 0;

    for (const { vehicleId, deviceSerial } of mappings) {
      if (!vehicleId || !deviceSerial) continue;
      try {
        await TelematicsDevice.findOneAndUpdate(
          { organizationId, vehicleId },
          { organizationId, vehicleId, provider, deviceSerial, credentials: encryptedCredentials, isActive: true, lastError: null },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        paired++;
      } catch (e) {
        errors.push({ vehicleId, error: e.message });
      }
    }

    // Update org integration type once
    await Organization.findByIdAndUpdate(organizationId, { integrationType: provider });

    res.status(201).json({ paired, errors });
  } catch (err) {
    console.error("bulkPair error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

module.exports = { testConnection, pairDevice, getOrgDevices, unpairDevice, syncNow, discoverDevices, bulkPair };
