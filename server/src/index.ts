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


const app = express();

app.use("/uploads", express.static("uploads"));
app.use(cors({
  origin: ['http://192.168.4.202', 'http://localhost:5173'],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"], // Allow Authorization header
    credentials: true // Allow cookies and authentication headers
}));
app.use(bodyParser.json());
dotenv.config();

const PORT = process.env.PORT || 7000;
const MONGOURL = process.env.MONGO_URL as string;

mongoose    
        .connect(MONGOURL)
        .then(() => {
            console.log("DB connected successfully");
            app.listen(PORT, () => {
                console.log(`Server is running on port ${PORT}`)
            })
        })
        .catch((error) => console.log(error));

app.use("/api/auth", authRoutes);
app.use("/api/drivers", driverRoute);
app.use("/api/timesheets", timesheetRoutes);
app.use("/api/timesheet", timesheetRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/contacts", contactRoutes);