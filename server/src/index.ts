import express from "express";
import cors, { CorsOptions } from "cors";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import dotenv from "dotenv";

import authRoutes from "../routes/authRoute.js";
import timesheetRoutes from "../routes/timesheetRoute.js";
import uploadRoutes from "../routes/uploadRoute.js";
import driverRoute from "../routes/driverRoute.js";
import contactRoutes from "../routes/contactRoute.js";
import notificationRoutes from "../routes/notificationRoute.js";

dotenv.config();

const app = express();

// ✅ Allowlist of frontends
const allowedOrigins: string[] = ['http://3.145.161.98', 'http://localhost:5173'];

const corsOptions: CorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

// ✅ Middleware
app.options("*", cors(corsOptions));
app.use("/uploads", express.static("uploads"));
app.use(cors(corsOptions));
app.use(bodyParser.json());

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/drivers", driverRoute);
app.use("/api/timesheets", timesheetRoutes);
app.use("/api/timesheet", timesheetRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/notifications", notificationRoutes);

// ✅ DB Connection + Server Startup
const PORT = process.env.PORT || 7000;
const MONGOURL = process.env.MONGO_URL as string;

mongoose
  .connect(MONGOURL)
  .then(() => {
    console.log("✅ DB connected successfully");
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((error) => console.error("❌ MongoDB connection error:", error));
