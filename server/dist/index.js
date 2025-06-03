"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const mongoose_1 = __importDefault(require("mongoose"));
const body_parser_1 = __importDefault(require("body-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
// @ts-ignore
const authRoute_js_1 = __importDefault(require("../routes/authRoute.js"));
// @ts-ignore
const timesheetRoute_1 = __importDefault(require("../routes/timesheetRoute"));
// @ts-ignore
const uploadRoute_1 = __importDefault(require("../routes/uploadRoute"));
// @ts-ignore
const driverRoute_1 = __importDefault(require("../routes/driverRoute"));
// @ts-ignore
const contactRoute_1 = __importDefault(require("../routes/contactRoute"));
// @ts-ignore
const notificationRoute_js_1 = __importDefault(require("../routes/notificationRoute.js"));
const app = (0, express_1.default)();
app.options("*", (0, cors_1.default)({
    origin: (origin, callback) => {
        const allowedOrigins = ['http://3.145.147.181', 'http://localhost:5173'];
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));
app.use("/uploads", express_1.default.static("uploads"));
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        const allowedOrigins = ['http://3.145.147.181', 'http://localhost:5173'];
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));
app.use(body_parser_1.default.json());
dotenv_1.default.config();
const PORT = process.env.PORT || 7000;
const MONGOURL = process.env.MONGO_URL;
mongoose_1.default
    .connect(MONGOURL)
    .then(() => {
    console.log("DB connected successfully");
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
})
    .catch((error) => console.log(error));
app.use("/api/auth", authRoute_js_1.default);
app.use("/api/drivers", driverRoute_1.default);
app.use("/api/timesheets", timesheetRoute_1.default);
app.use("/api/timesheet", timesheetRoute_1.default);
app.use("/api/uploads", uploadRoute_1.default);
app.use("/api/contacts", contactRoute_1.default);
app.use("/api/notifications", notificationRoute_js_1.default);
