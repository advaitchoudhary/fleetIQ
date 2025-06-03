import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import dotenv from "dotenv";
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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 7000;
const MONGOURL = process.env.MONGO_URL as string;
const NODE_ENV = process.env.NODE_ENV || "development";

const allowedOrigins = [
  "http://localhost:5173",
  "http://54.163.160.146",
  "http://54.163.160.146:80",
  "http://54.163.160.146:3000", // if using dev port
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn("❌ Blocked by CORS:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));


app.use("/uploads", express.static("uploads"));
app.use(bodyParser.json());

mongoose
  .connect(MONGOURL)
  .then(() => {
    console.log("DB connected successfully");
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => console.log(error));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/drivers", driverRoute);
app.use("/api/timesheets", timesheetRoutes);
app.use("/api/timesheet", timesheetRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/contacts", contactRoutes);
