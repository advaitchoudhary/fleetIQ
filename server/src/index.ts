import express from "express"
import cors from "cors";
import mongoose from "mongoose"
import bodyParser from "body-parser"
import dotenv from "dotenv"
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
// @ts-ignore
import notificationRoutes from "../routes/notificationRoute.js";
// @ts-ignore
import driverApplicationRoutes from "../routes/driverApplicationRoute.js";


const app = express();

app.options("*", cors({
    origin: (origin, callback) => {
       const allowedOrigins = [
          'http://3.13.233.198',
          'http://localhost:5173',
          'http://premierchoicemployment.com',
          'https://premierchoicemployment.com',
          'https://www.premierchoicemployment.com'
    ];
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));

app.use("/uploads", express.static("uploads"));
app.use(cors({
    origin: (origin, callback) => {
       const allowedOrigins = [
          'http://3.13.233.198',
          'http://localhost:5173',
          'http://premierchoicemployment.com',
          'https://premierchoicemployment.com',
          'https://www.premierchoicemployment.com'
    ];
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  }));
app.use(bodyParser.json());
dotenv.config();

const PORT = process.env.PORT || 7000;
const MONGOURL = process.env.MONGO_URL as string;

if (!MONGOURL) {
    console.error("❌ MONGO_URL environment variable is not set!");
    process.exit(1);
}

mongoose
    .connect(MONGOURL, {
        serverSelectionTimeoutMS: 10000, // Timeout after 10 seconds instead of 30
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        connectTimeoutMS: 10000, // Give up initial connection after 10 seconds
        retryWrites: true,
        w: 'majority'
    })
    .then(() => {
        console.log("✅ DB connected successfully");
        app.listen(PORT, () => {
            console.log(`🚀 Server is running on port ${PORT}`)
        })
    })
    .catch((error) => {
        console.error("❌ Database connection failed:", error.message);
        console.error("\n💡 Troubleshooting steps:");
        console.error("1. Check if MongoDB server is running");
        console.error("2. Verify MONGO_URL in .env file is correct");
        console.error("3. Check network connectivity to MongoDB server");
        console.error("4. Verify firewall allows connections on port 27017");
        console.error("5. If using remote MongoDB, check if it requires authentication");
        console.error("\nCurrent MONGO_URL:", MONGOURL.replace(/\/\/.*@/, '//***:***@')); // Hide credentials
        process.exit(1);
    });

app.use("/api/auth", authRoutes);
app.use("/api/drivers", driverRoute);
app.use("/api/timesheets", timesheetRoutes);
app.use("/api/timesheet", timesheetRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/driver-applications", driverApplicationRoutes);