const TelematicsDevice = require("../model/telematicsDeviceModel");
const Vehicle = require("../model/vehicleModel");
const Location = require("../model/locationModel");
const { decrypt } = require("./credentialCrypto");
const geotabClient = require("./geotabClient");
const samsaraClient = require("./samsaraClient");

async function pollAllDevices() {
  const devices = await TelematicsDevice.find({ isActive: true }).lean();
  if (devices.length === 0) return;

  const geotabByOrg = {};
  const samsaraByOrg = {};

  for (const device of devices) {
    const orgId = device.organizationId.toString();
    if (device.provider === "geotab") {
      if (!geotabByOrg[orgId]) geotabByOrg[orgId] = { credentials: null, devices: [] };
      if (!geotabByOrg[orgId].credentials) geotabByOrg[orgId].credentials = decrypt(device.credentials);
      geotabByOrg[orgId].devices.push(device);
    } else if (device.provider === "samsara") {
      if (!samsaraByOrg[orgId]) samsaraByOrg[orgId] = { token: null, devices: [] };
      if (!samsaraByOrg[orgId].token) samsaraByOrg[orgId].token = decrypt(device.credentials).apiToken;
      samsaraByOrg[orgId].devices.push(device);
    }
  }

  const tasks = [];

  // Geotab polling
  for (const [orgId, group] of Object.entries(geotabByOrg)) {
    const serials = group.devices.map(d => d.deviceSerial);
    tasks.push(
      geotabClient.getPositions(orgId, group.credentials, serials)
        .then(positions => applyPositions(positions, group.devices, "serial", "geotab"))
        .catch(err => markErrors(group.devices, err.message))
    );
  }

  // Samsara polling
  for (const [, group] of Object.entries(samsaraByOrg)) {
    const samsaraIds = group.devices.map(d => d.deviceSerial);
    tasks.push(
      samsaraClient.getPositions(group.token, samsaraIds)
        .then(positions => applyPositions(positions, group.devices, "samsaraId", "samsara"))
        .catch(err => markErrors(group.devices, err.message))
    );
  }

  await Promise.allSettled(tasks);
}

async function applyPositions(positions, devices, idField, provider) {
  const deviceMap = Object.fromEntries(devices.map(d => [d.deviceSerial, d]));
  const now = new Date();

  for (const pos of positions) {
    const device = deviceMap[pos[idField]];
    if (!device || pos.lat == null || pos.lng == null) continue;

    const coord = { lat: pos.lat, lng: pos.lng, speed: pos.speed || 0, timestamp: now };

    await Vehicle.findByIdAndUpdate(device.vehicleId, {
      lastLocation: { ...coord, isActive: true, driverId: null },
      telematicsSource: provider,
    });

    await Location.findOneAndUpdate(
      { vehicleId: device.vehicleId, tripEnd: null },
      { $push: { coordinates: { $each: [coord], $slice: -2880 } } }
    );

    await TelematicsDevice.findByIdAndUpdate(device._id, { lastSync: now, lastError: null });
  }
}

async function markErrors(devices, message) {
  for (const device of devices) {
    await TelematicsDevice.findByIdAndUpdate(device._id, { lastError: message });
  }
}

module.exports = { pollAllDevices };
