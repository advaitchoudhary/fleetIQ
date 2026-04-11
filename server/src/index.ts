import dotenv from "dotenv"
dotenv.config();

import express from "express"
import cors from "cors";
import mongoose from "mongoose"
import bodyParser from "body-parser"
import cookieParser from "cookie-parser"
import path from "path"
// @ts-ignore
import helmet from "helmet";
// @ts-ignore
import compression from "compression";
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
// @ts-ignore
import organizationRoutes from "../routes/organizationRoute.js";
// @ts-ignore
import vehicleRoutes from "../routes/vehicleRoute.js";
// @ts-ignore
import maintenanceRoutes from "../routes/maintenanceRoute.js";
// @ts-ignore
import inspectionRoutes from "../routes/inspectionRoute.js";
// @ts-ignore
import fuelLogRoutes from "../routes/fuelLogRoute.js";
// @ts-ignore
import costTrackingRoutes from "../routes/costTrackingRoute.js";
// @ts-ignore
import paymentRoutes from "../routes/paymentRoute.js";
// @ts-ignore
import subscriptionRoutes from "../routes/subscriptionRoute.js";
// @ts-ignore
import schedulingRoutes from "../routes/schedulingRoute.js";
// @ts-ignore
import partRoutes from "../routes/partRoute.js";
// @ts-ignore
import warrantyRoutes from "../routes/warrantyRoute.js";
// @ts-ignore
import serviceHistoryRoutes from "../routes/serviceHistoryRoute.js";
// @ts-ignore
import pmRoutes from "../routes/pmRoute.js";
// @ts-ignore
import trackingRoutes from "../routes/trackingRoute.js";
// @ts-ignore
import chatRoutes from "../routes/chatRoute.js";
// @ts-ignore
import telematicsRoutes from "../routes/telematicsRoute.js";
// @ts-ignore
import iftaRoutes from "../routes/iftaRoute.js";
// @ts-ignore
import { pollAllDevices } from "../utils/telematicsAdapter.js";
// @ts-ignore
import Location from "../model/locationModel.js";
// @ts-ignore
import Vehicle from "../model/vehicleModel.js";
// @ts-ignore
import cron from "node-cron";
// @ts-ignore
import { runDailyDigest } from "../utils/dailyDigest.js";
// @ts-ignore
import { runSubscriptionReminders } from "../utils/subscriptionReminders.js";

const app = express();

// Stripe webhooks require raw body — must be registered BEFORE bodyParser.json
// These are handled inside the route files using express.raw() per-route

// Security headers
app.use(helmet({ contentSecurityPolicy: false })); // CSP disabled to avoid breaking existing inline styles
// Gzip compression for all responses
app.use(compression());

app.options("*", cors({
    origin: (origin, callback) => {
       const allowedOrigins = [
          'http://localhost:5173',
          'http://127.0.0.1:5173',
          'http://192.168.29.113:5173',
          'http://fleetiqlogistics.com',
          'https://fleetiqlogistics.com',
          'https://www.fleetiqlogistics.com'
    ];
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log(`❌ CORS blocked origin: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));

app.use("/uploads", express.static(path.join(__dirname, "../../uploads")));
app.use(cors({
    origin: (origin, callback) => {
       const allowedOrigins = [
          'http://localhost:5173',
          'http://127.0.0.1:5173',
          'http://192.168.29.113:5173',
          'http://fleetiqlogistics.com',
          'https://fleetiqlogistics.com',
          'https://www.fleetiqlogistics.com'
    ];
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log(`❌ CORS blocked origin: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  }));
app.use(cookieParser());

// Stripe webhook routes MUST be mounted before bodyParser.json() so that
// their per-route express.raw() middleware receives the raw body buffer.
// bodyParser.json() would otherwise consume and discard the raw body first,
// causing stripe.webhooks.constructEvent() to throw a signature error.
app.use("/api/payments", paymentRoutes);
app.use("/api/subscriptions", subscriptionRoutes);

app.use(bodyParser.json({ limit: "10mb" }));

const PORT = process.env.PORT || 8000;
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

        // Auto-close stale trips: runs every 10 minutes
        // Closes any trip with no ping in the last 15 minutes (driver closed browser)
        const STALE_TRIP_INTERVAL = 10 * 60 * 1000;
        const STALE_TRIP_CUTOFF_MS = 15 * 60 * 1000;
        setInterval(async () => {
            try {
                const cutoff = new Date(Date.now() - STALE_TRIP_CUTOFF_MS);
                const staleTrips = await Location.find({ tripEnd: null, updatedAt: { $lt: cutoff } }).lean();
                for (const trip of staleTrips) {
                    await Location.findByIdAndUpdate(trip._id, { tripEnd: new Date() });
                    await Vehicle.findByIdAndUpdate(trip.vehicleId, { "lastLocation.isActive": false });
                }
                if (staleTrips.length > 0) {
                    console.log(`🧹 Auto-closed ${staleTrips.length} stale trip(s)`);
                }
            } catch (err) {
                console.error("Stale trip cleanup error:", err);
            }
        }, STALE_TRIP_INTERVAL);

        // Hardware telematics poll — every 5 minutes
        setInterval(() => {
            pollAllDevices().catch((err: Error) => console.error("[Telematics] Poll error:", err));
        }, 5 * 60 * 1000);
        console.log("🛰️  Telematics polling scheduled every 5 minutes");

        // Daily digest email — runs at 07:00 every morning
        cron.schedule("0 7 * * *", () => {
            runDailyDigest().catch((err: Error) => console.error("[DailyDigest] Error:", err));
        });
        console.log("📧 Daily digest cron scheduled at 07:00");

        // Subscription trial warning emails — runs at 09:00 every morning
        // Sends 3-day and 1-day warnings to orgs whose trial is about to expire
        cron.schedule("0 9 * * *", () => {
            runSubscriptionReminders().catch((err: Error) => console.error("[SubscriptionReminders] Error:", err));
        });
        console.log("🔔 Subscription reminder cron scheduled at 09:00");

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
app.use("/api/organizations", organizationRoutes);
app.use("/api/drivers", driverRoute);
app.use("/api/timesheets", timesheetRoutes);
app.use("/api/timesheet", timesheetRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/driver-applications", driverApplicationRoutes);
// Phase 2 — Vehicle Management
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/inspections", inspectionRoutes);
app.use("/api/fuel-logs", fuelLogRoutes);
app.use("/api/costs", costTrackingRoutes);
app.use("/api/scheduling", schedulingRoutes);
app.use("/api/parts", partRoutes);
app.use("/api/warranties", warrantyRoutes);
app.use("/api/service-history", serviceHistoryRoutes);
app.use("/api/pm", pmRoutes);
app.use("/api/tracking", trackingRoutes);
app.use("/api/telematics", telematicsRoutes);
app.use("/api/ifta", iftaRoutes);
app.use("/api/chat", chatRoutes);
// Phase 3 — Driver Payments (Stripe Connect) and Phase 4 — Subscriptions are
// mounted before bodyParser.json() above so Stripe webhooks receive raw body.