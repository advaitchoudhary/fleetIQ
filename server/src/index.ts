import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import dotenv from "dotenv";

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// @ts-ignore
import authRoutes from "../routes/authRoute.js";
// @ts-ignore
import timesheetRoutes from "../routes/timesheetRoute";
// @ts-ignore
import uploadRoutes from "../routes/uploadRoute";
// @ts-ignore
import driverRoute from "../routes/driverRoute";
// @ts-ignore
import contactRoutes from "../routes/contactRoute";

const app = express();

// ✅ Static files (uploads)
app.use('/uploads', express.static(join(__dirname, 'uploads')));

// ✅ CORS config
app.use(cors({
  origin: ['http://192.168.4.202', 'http://localhost:5173'],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.use(bodyParser.json());
dotenv.config();

const PORT = process.env.PORT || 7000;
const MONGOURL = process.env.MONGO_URL as string;

mongoose.connect(MONGOURL)
  .then(() => {
    console.log("DB connected successfully");
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => console.log(error));

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/drivers", driverRoute);
app.use("/api/timesheets", timesheetRoutes);
app.use("/api/timesheet", timesheetRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/contacts", contactRoutes);
