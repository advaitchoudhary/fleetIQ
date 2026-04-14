const axios = require("axios");

async function getPositions(apiToken, samsaraVehicleIds) {
  const response = await axios.get("https://api.samsara.com/fleet/vehicles/locations", {
    headers: { Authorization: `Bearer ${apiToken}` },
    timeout: 15000,
  });
  const data = response.data?.data || [];
  return data
    .filter(v => samsaraVehicleIds.includes(v.id))
    .map(v => ({
      samsaraId: v.id,
      lat: v.location?.latitude,
      lng: v.location?.longitude,
      speed: (v.location?.speedMilesPerHour || 0) * 1.60934, // mph → km/h
      odometer: v.engineStates?.[0]?.value ?? null,
      timestamp: new Date(),
    }));
}

async function testConnection(apiToken) {
  const response = await axios.get("https://api.samsara.com/fleet/vehicles", {
    headers: { Authorization: `Bearer ${apiToken}` },
    params: { limit: 1 },
    timeout: 10000,
  });
  return response.status === 200;
}

async function listVehicles(apiToken) {
  const response = await axios.get("https://api.samsara.com/fleet/vehicles", {
    headers: { Authorization: `Bearer ${apiToken}` },
    params: { limit: 512 },
    timeout: 15000,
  });
  const data = response.data?.data || [];
  return data.map(v => ({
    id: v.id,
    name: v.name || v.id,
    serial: v.id, // Samsara uses vehicle ID as the pairing key
  }));
}

module.exports = { getPositions, testConnection, listVehicles };
