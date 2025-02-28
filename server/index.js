import express from "express"
import cors from "cors";
import mongoose from "mongoose"
import bodyParser from "body-parser"
import dotenv from "dotenv"
import authRoutes from "./routes/authRoute.js";
import route from "./routes/driverRoute.js"

const app = express();
app.use(cors({
    origin: "http://localhost:5173", // Update this with your frontend URL
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"]
  }));
app.use(bodyParser.json());
dotenv.config();

const PORT = process.env.PORT || 7000;
const MONGOURL = process.env.MONGO_URL;

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
app.use("/api", route);