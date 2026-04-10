const Location = require("../model/locationModel");
const FuelLog = require("../model/fuelLogModel");
const Vehicle = require("../model/vehicleModel");
const { getOrgFilter } = require("../middleware/authMiddleware");
const { batchGetJurisdictions } = require("../utils/hereGeocode");
const taxRates = require("../utils/iftaTaxRates");
const PDFDocument = require("pdfkit");

function getQuarterDates(quarter, year) {
  const quarters = {
    Q1: [new Date(`${year}-01-01`), new Date(`${year}-04-01`)],
    Q2: [new Date(`${year}-04-01`), new Date(`${year}-07-01`)],
    Q3: [new Date(`${year}-07-01`), new Date(`${year}-10-01`)],
    Q4: [new Date(`${year}-10-01`), new Date(`${year + 1}-01-01`)],
  };
  return quarters[quarter] || null;
}

function haversine(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

async function buildReport(orgFilter, quarter, year, vehicleId) {
  const dates = getQuarterDates(quarter, parseInt(year));
  if (!dates) throw new Error("Invalid quarter. Use Q1, Q2, Q3, or Q4.");
  const [start, end] = dates;

  const tripFilter = { ...orgFilter, tripEnd: { $ne: null }, tripStart: { $gte: start, $lt: end } };
  if (vehicleId) tripFilter.vehicleId = vehicleId;

  const trips = await Location.find(tripFilter).lean();

  // Collect unique coordinates (deduplicated by 1km² grid cell)
  const seen = new Set();
  const uniqueCoords = [];
  const coordTrips = []; // parallel array: which trip each unique coord belongs to

  for (const trip of trips) {
    for (const coord of trip.coordinates) {
      const key = `${coord.lat.toFixed(2)}_${coord.lng.toFixed(2)}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueCoords.push(coord);
      }
    }
  }

  // Geocode all unique coordinates
  const jurisdictions = await batchGetJurisdictions(uniqueCoords);
  const coordJurisdictionMap = new Map();
  uniqueCoords.forEach((c, i) => {
    const key = `${c.lat.toFixed(2)}_${c.lng.toFixed(2)}`;
    coordJurisdictionMap.set(key, jurisdictions[i]);
  });

  // Calculate miles per jurisdiction
  const milesByJurisdiction = {};
  for (const trip of trips) {
    for (let i = 1; i < trip.coordinates.length; i++) {
      const a = trip.coordinates[i - 1];
      const b = trip.coordinates[i];
      const jKey = `${b.lat.toFixed(2)}_${b.lng.toFixed(2)}`;
      const jurisdiction = coordJurisdictionMap.get(jKey);
      if (!jurisdiction) continue;
      const dist = haversine(a, b);
      milesByJurisdiction[jurisdiction] = (milesByJurisdiction[jurisdiction] || 0) + dist;
    }
  }

  // Fuel purchased per jurisdiction from FuelLogs
  const fuelFilter = { ...orgFilter, date: { $gte: start, $lt: end }, state: { $ne: null } };
  if (vehicleId) fuelFilter.vehicleId = vehicleId;
  const fuelLogs = await FuelLog.find(fuelFilter).lean();
  const fuelByJurisdiction = {};
  for (const log of fuelLogs) {
    if (log.state) fuelByJurisdiction[log.state] = (fuelByJurisdiction[log.state] || 0) + log.litres;
  }

  // Build result
  const allJurisdictions = new Set([...Object.keys(milesByJurisdiction), ...Object.keys(fuelByJurisdiction)]);
  const result = [];
  for (const code of allJurisdictions) {
    const km = milesByJurisdiction[code] || 0;
    const miles = km * 0.621371;
    const fuel = fuelByJurisdiction[code] || 0;
    const rate = taxRates[code] || 0;
    const netTax = parseFloat((fuel * rate).toFixed(2));
    result.push({
      code,
      milesDriven: parseFloat(miles.toFixed(2)),
      kmDriven: parseFloat(km.toFixed(2)),
      fuelPurchasedLitres: parseFloat(fuel.toFixed(2)),
      taxRatePerLitre: rate,
      netTaxDue: netTax,
    });
  }

  result.sort((a, b) => a.code.localeCompare(b.code));

  const totals = result.reduce(
    (acc, r) => ({
      milesDriven: acc.milesDriven + r.milesDriven,
      fuelPurchasedLitres: acc.fuelPurchasedLitres + r.fuelPurchasedLitres,
      netTaxDue: acc.netTaxDue + r.netTaxDue,
    }),
    { milesDriven: 0, fuelPurchasedLitres: 0, netTaxDue: 0 }
  );

  return { period: `${quarter} ${year}`, generatedAt: new Date(), jurisdictions: result, totals };
}

const generateReport = async (req, res) => {
  try {
    const { quarter, year, vehicleId } = req.query;
    if (!quarter || !year) return res.status(400).json({ message: "quarter and year are required" });
    const orgFilter = getOrgFilter(req);
    const report = await buildReport(orgFilter, quarter, year, vehicleId);
    res.json(report);
  } catch (err) {
    console.error("IFTA generateReport error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

const downloadPDF = async (req, res) => {
  try {
    const { quarter, year, vehicleId } = req.query;
    if (!quarter || !year) return res.status(400).json({ message: "quarter and year are required" });
    const orgFilter = getOrgFilter(req);
    const report = await buildReport(orgFilter, quarter, year, vehicleId);

    const doc = new PDFDocument({ margin: 40 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=IFTA_${quarter}_${year}.pdf`);
    doc.pipe(res);

    // Header
    doc.fontSize(18).text(`IFTA Quarterly Report — ${report.period}`, { align: "center" });
    doc.fontSize(10).text(`Generated: ${report.generatedAt.toLocaleDateString()}`, { align: "center" });
    doc.moveDown(2);

    // Table header
    const cols = { code: 40, miles: 180, fuel: 310, rate: 390, tax: 470 };
    doc.fontSize(9).font("Helvetica-Bold");
    doc.text("Jurisdiction", cols.code, doc.y);
    doc.text("Miles Driven", cols.miles, doc.y - doc.currentLineHeight());
    doc.text("Fuel (L)", cols.fuel, doc.y - doc.currentLineHeight());
    doc.text("Tax Rate", cols.rate, doc.y - doc.currentLineHeight());
    doc.text("Net Tax Due", cols.tax, doc.y - doc.currentLineHeight());
    doc.moveDown(0.5);
    doc.moveTo(40, doc.y).lineTo(560, doc.y).stroke();
    doc.moveDown(0.3);

    // Rows
    doc.font("Helvetica").fontSize(9);
    for (const j of report.jurisdictions) {
      const y = doc.y;
      doc.text(j.code, cols.code, y);
      doc.text(j.milesDriven.toLocaleString(), cols.miles, y);
      doc.text(j.fuelPurchasedLitres.toLocaleString(), cols.fuel, y);
      doc.text(`$${j.taxRatePerLitre.toFixed(4)}`, cols.rate, y);
      doc.text(`$${j.netTaxDue.toFixed(2)}`, cols.tax, y);
      doc.moveDown(0.8);
    }

    // Totals
    doc.moveTo(40, doc.y).lineTo(560, doc.y).stroke();
    doc.moveDown(0.3);
    doc.font("Helvetica-Bold").fontSize(9);
    const ty = doc.y;
    doc.text("TOTAL", cols.code, ty);
    doc.text(report.totals.milesDriven.toFixed(2), cols.miles, ty);
    doc.text(report.totals.fuelPurchasedLitres.toFixed(2), cols.fuel, ty);
    doc.text("", cols.rate, ty);
    doc.text(`$${report.totals.netTaxDue.toFixed(2)}`, cols.tax, ty);

    doc.end();
  } catch (err) {
    console.error("IFTA downloadPDF error:", err);
    if (!res.headersSent) res.status(500).json({ message: err.message || "Server error" });
  }
};

module.exports = { generateReport, downloadPDF };
