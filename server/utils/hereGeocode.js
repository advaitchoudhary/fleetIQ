const axios = require("axios");

// In-memory LRU-style cache (bounded at MAX_SIZE)
const cache = new Map();
const MAX_SIZE = 10000;

function cacheKey(lat, lng) {
  return `${lat.toFixed(2)}_${lng.toFixed(2)}`;
}

function evictIfNeeded() {
  if (cache.size >= MAX_SIZE) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
}

async function getJurisdiction(lat, lng) {
  const key = cacheKey(lat, lng);
  if (cache.has(key)) return cache.get(key);

  const apiKey = process.env.HERE_API_KEY;
  if (!apiKey) throw new Error("HERE_API_KEY not set");

  const response = await axios.get("https://revgeocode.search.hereapi.com/v1/revgeocode", {
    params: { at: `${lat},${lng}`, apiKey, lang: "en" },
    timeout: 8000,
  });

  const item = response.data?.items?.[0];
  if (!item) return null;

  // US: stateCode (e.g. "NY"), Canada: countryCode + stateCode (e.g. "ON")
  const jurisdiction = item.address?.stateCode || null;

  evictIfNeeded();
  cache.set(key, jurisdiction);
  return jurisdiction;
}

// Batch geocode with concurrency limit of 5
async function batchGetJurisdictions(coords) {
  const results = [];
  const CONCURRENCY = 5;
  for (let i = 0; i < coords.length; i += CONCURRENCY) {
    const batch = coords.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map(c => getJurisdiction(c.lat, c.lng).catch(() => null))
    );
    results.push(...batchResults);
  }
  return results;
}

module.exports = { getJurisdiction, batchGetJurisdictions };
