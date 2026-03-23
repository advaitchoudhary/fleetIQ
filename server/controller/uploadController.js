const fs = require("fs");
const path = require("path");
const { promisify } = require("util");
const multer = require("multer");
const Dispatch = require("../model/uploadModel.js"); // Import model
const pdf2json = require("pdf2json");
const { getOrgFilter } = require("../middleware/authMiddleware.js");

// Resolve uploads directory relative to this file so it works regardless of cwd
const UPLOADS_DIR = path.join(__dirname, "../../uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  },
});

const multerInstance = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Only PDF files are allowed"), false);
    }
    cb(null, true);
  },
}).single("file");

// Wrap multer so file-type errors are returned as JSON (400) instead of crashing
const upload = (req, res, next) => {
  multerInstance(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || "File upload error" });
    }
    next();
  });
};

const unlinkAsync = promisify(fs.unlink);

const processFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const filePath = req.file.path;
        const fileName = req.file.filename;
        // organizationId from the authenticated user (set by protect middleware)
        const organizationId = req.organizationId || null;

        const pdfParser = new pdf2json();

        pdfParser.on("pdfParser_dataReady", async (pdfData) => {
            try {
                const extractedText = pdfData.Pages.map(page =>
                    page.Texts.map(text => decodeURIComponent(text.R[0].T)).join(" ")
                ).join("\n");

                const structuredData = parseDispatchSheet(extractedText);

                if (structuredData.length > 0) {
                    // Attach organizationId to every record for multi-tenant scoping
                    const records = structuredData.map((row) => ({ ...row, organizationId }));
                    await Dispatch.insertMany(records);
                } else {
                    console.log("⚠️ No structured data extracted from the PDF.");
                }

                // Delete the uploaded file after successful parsing and DB insert
                try { await unlinkAsync(filePath); } catch (_) { /* best-effort cleanup */ }

                res.status(200).json({ message: "Data extracted & saved", count: structuredData.length, structuredData });
            } catch (innerErr) {
                console.error("❌ Error saving dispatch data:", innerErr);
                // Attempt cleanup even on inner error
                try { await unlinkAsync(filePath); } catch (_) { /* ignore */ }
                if (!res.headersSent) {
                    res.status(500).json({ message: "Failed to save dispatch data", error: innerErr.message });
                }
            }
        });

        pdfParser.on("pdfParser_dataError", async (err) => {
            console.error("❌ PDF Parsing Error:", err);
            try { await unlinkAsync(filePath); } catch (_) { /* ignore */ }
            if (!res.headersSent) {
                res.status(500).json({ message: "Failed to process PDF", error: err.parserError || String(err) });
            }
        });

        pdfParser.loadPDF(filePath);
    } catch (error) {
        console.error("❌ Error processing file:", error);
        res.status(500).json({ message: "Failed to process file", error: error.message });
    }
};

  const parseDispatchSheet = (text) => {
    const lines = text.split("\n").map(line => line.trim()).filter(line => line);
    let extractedData = [];

    for (let i = 0; i < lines.length; i++) {
        console.log("Processing Line:", lines[i]); // ✅ Debugging Line

        const match = lines[i].match(/(\d{7})\s+(\d{7})\s+(\w+)\s+(\d{1,2}\/\d{1,2}\/\d{2,4})\s+(\d+)\s+([\w\s]+)\s+(\d{1,2}:\d{2})\s+([\w\s]+)\s+(\d+)\s+(\d{1,2}:\d{2})\s+(\d{1,2}:\d{2})\s+([\w,]+)\s+(\d+)\s+([\d.]+)/);

        if (match) {
            const row = {
                route: match[1],
                loadId: match[2],
                trailerType: match[3],
                tripDate: match[4],
                storeNumber: match[5],
                storeName: match[6].trim(),
                eta: match[7],
                city: match[8],
                stopNumber: match[9],
                windowIn: match[10],
                windowOut: match[11],
                commodity: match[12],
                totalPCS: match[13],
                totalCube: match[14],
            };

            console.log("Extracted Row:", row); // ✅ Debugging Line
            extractedData.push(row);
        }
    }

    return extractedData;
};

const getDispatches = async (req, res) => {
    try {
        const orgFilter = getOrgFilter(req);
        const dispatches = await Dispatch.find(orgFilter).sort({ createdAt: -1 });
        res.status(200).json(dispatches);
    } catch (error) {
        console.error("Error fetching dispatch data:", error);
        res.status(500).json({ message: "Failed to fetch data", error: error.message });
    }
};

module.exports = {
  upload,
  processFile,
  getDispatches
};
