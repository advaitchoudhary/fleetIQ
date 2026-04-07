const Vehicle = require("../model/vehicleModel");
const Location = require("../model/locationModel");
const { getOrgFilter } = require("../middleware/authMiddleware");

function haversineDistance(coords) {
  if (coords.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < coords.length; i++) {
    const R = 6371;
    const dLat = ((coords[i].lat - coords[i - 1].lat) * Math.PI) / 180;
    const dLng = ((coords[i].lng - coords[i - 1].lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((coords[i - 1].lat * Math.PI) / 180) *
        Math.cos((coords[i].lat * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    total += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  return Math.round(total * 10) / 10;
}

const startTrip = async (req, res) => {
  try {
    const { vehicleId } = req.body;
    const driverId = req.user.id;
    const organizationId = req.organizationId;
    if (!vehicleId) return res.status(400).json({ message: "vehicleId is required" });
    const vehicle = await Vehicle.findOne({ _id: vehicleId, organizationId: req.organizationId });
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });
    await Location.findOneAndUpdate({ vehicleId, tripEnd: null }, { tripEnd: new Date() });
    const trip = await Location.create({ organizationId, vehicleId, driverId, tripStart: new Date(), coordinates: [] });
    await Vehicle.findByIdAndUpdate(vehicleId, { "lastLocation.isActive": true, "lastLocation.driverId": driverId });
    res.status(201).json({ tripId: trip._id, message: "Trip started" });
  } catch (err) {
    console.error("startTrip error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const updateLocation = async (req, res) => {
  try {
    const { lat, lng, speed, vehicleId, tripId } = req.body;
    const driverId = req.user.id;
    if (lat == null || lng == null || !vehicleId || !tripId) return res.status(400).json({ message: "lat, lng, vehicleId, tripId are required" });
    // Verify vehicle belongs to driver's org
    const vehicle = await Vehicle.findOne({ _id: vehicleId, organizationId: req.organizationId });
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });
    const coord = { lat, lng, speed: speed || 0, timestamp: new Date() };
    await Vehicle.findByIdAndUpdate(vehicleId, { lastLocation: { lat, lng, speed: speed || 0, timestamp: new Date(), isActive: true, driverId } });
    // $slice -2880 caps array at 2880 entries (24h at 30s intervals), dropping oldest first
    await Location.findByIdAndUpdate(tripId, { $push: { coordinates: { $each: [coord], $slice: -2880 } } });
    res.json({ message: "Location updated" });
  } catch (err) {
    console.error("updateLocation error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const endTrip = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { vehicleId } = req.body;
    const trip = await Location.findById(tripId);
    if (!trip) return res.status(404).json({ message: "Trip not found" });
    if (trip.driverId.toString() !== req.user.id) return res.status(403).json({ message: "Not authorized to end this trip" });
    const totalDistance = haversineDistance(trip.coordinates);
    await Location.findByIdAndUpdate(tripId, { tripEnd: new Date(), totalDistance });
    if (vehicleId) await Vehicle.findByIdAndUpdate(vehicleId, { "lastLocation.isActive": false });
    res.json({ message: "Trip ended", totalDistance });
  } catch (err) {
    console.error("endTrip error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const getLiveLocations = async (req, res) => {
  try {
    const orgFilter = getOrgFilter(req);
    const vehicles = await Vehicle.find(orgFilter)
      .select("unitNumber make model type status lastLocation assignedDriverId")
      .populate("assignedDriverId", "name email")
      .limit(200)
      .lean();
    res.json(vehicles);
  } catch (err) {
    console.error("getLiveLocations error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const getTripHistory = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const orgFilter = getOrgFilter(req);
    const trips = await Location.find({ vehicleId, tripEnd: { $ne: null }, ...orgFilter })
      .sort({ tripStart: -1 })
      .limit(20)
      .populate("driverId", "name email")
      .lean();
    res.json(trips);
  } catch (err) {
    console.error("getTripHistory error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const getMyVehicle = async (req, res) => {
  try {
    const driverId = req.user.id;
    const vehicle = await Vehicle.findOne({ assignedDriverId: driverId })
      .select("unitNumber make model")
      .lean();
    if (!vehicle) return res.status(200).json({ vehicle: null });
    res.json({ vehicle });
  } catch (err) {
    console.error("getMyVehicle error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { startTrip, updateLocation, endTrip, getLiveLocations, getTripHistory, getMyVehicle };
