import fs from "fs";
import { promisify } from "util";
import multer from "multer";
import path from "path";
import Dispatch from "../model/uploadModel.js"; // Import model
import pdf2json from "pdf2json";

const UPLOADS_DIR = "uploads/";
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

export const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Only PDF files are allowed"), false);
    }
    cb(null, true);
  },
}).single("file");

const unlinkAsync = promisify(fs.unlink);

export const processFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const filePath = req.file.path;
        const pdfParser = new pdf2json();

        pdfParser.on("pdfParser_dataReady", async (pdfData) => {
            const extractedText = pdfData.Pages.map(page =>
                page.Texts.map(text => decodeURIComponent(text.R[0].T)).join(" ")
            ).join("\n");

            console.log("✅ Extracted Text from PDF:\n", extractedText);  // Debug extracted text

            await unlinkAsync(filePath);

            const structuredData = parseDispatchSheet(extractedText);

            console.log("✅ Parsed Data Before Insert:\n", structuredData);  // Debug parsed data

            if (structuredData.length > 0) {
                await Dispatch.insertMany(structuredData);
                console.log("✅ Inserted Data into MongoDB:\n", structuredData);
            } else {
                console.log("⚠️ No structured data extracted from the PDF.");
            }

            res.status(200).json({ message: "Data extracted & saved", structuredData });
        });

        pdfParser.on("pdfParser_dataError", err => {
            console.error("❌ PDF Parsing Error:", err);
            res.status(500).json({ message: "Failed to process PDF", error: err.message });
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

export const getDispatches = async (req, res) => {
    try {
        const dispatches = await Dispatch.find();
        console.log("Fetched Dispatches from MongoDB:", dispatches); // ✅ Debugging MongoDB retrieval
        res.status(200).json(dispatches);
    } catch (error) {
        console.error("Error fetching dispatch data:", error);
        res.status(500).json({ message: "Failed to fetch data", error: error.message });
    }
};
