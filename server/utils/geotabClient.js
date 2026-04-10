const axios = require("axios");

// In-memory session cache: orgId → { result, expiresAt }
const sessionCache = new Map();
const SESSION_TTL_MS = 5 * 60 * 1000; // 5 min

async function authenticate(credentials) {
  const { server, database, username, password } = credentials;
  const url = `https://${server}/apiv1`;
  const response = await axios.post(url, {
    method: "Authenticate",
    params: { userName: username, password, database },
  }, { timeout: 10000 });
  if (response.data.error) throw new Error(response.data.error.message);
  return { server, database, result: response.data.result };
}

async function getSession(orgId, credentials) {
  const cached = sessionCache.get(orgId);
  if (cached && cached.expiresAt > Date.now()) return cached.session;
  const session = await authenticate(credentials);
  sessionCache.set(orgId, { session, expiresAt: Date.now() + SESSION_TTL_MS });
  return session;
}

async function getPositions(orgId, credentials, deviceSerials) {
  const session = await getSession(orgId, credentials);
  const { server, database, result } = session;
  const url = `https://${server}/apiv1`;
  const response = await axios.post(url, {
    method: "Get",
    params: {
      typeName: "DeviceStatusInfo",
      credentials: { userName: credentials.username, sessionId: result.credentials.sessionId, database },
    },
  }, { timeout: 15000 });
  if (response.data.error) {
    sessionCache.delete(orgId); // force re-auth on next call
    throw new Error(response.data.error.message);
  }
  return (response.data.result || [])
    .filter(item => deviceSerials.includes(item.device?.id))
    .map(item => ({
      serial: item.device?.id,
      lat: item.latitude,
      lng: item.longitude,
      speed: (item.speed || 0) * 1.60934, // mph → km/h
      odometer: (item.currentStateDuration || 0),
      timestamp: new Date(),
    }));
}

module.exports = { authenticate, getPositions };
