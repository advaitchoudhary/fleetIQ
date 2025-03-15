import mongoose from "mongoose";

const driverSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        contact: { type: String, required: true },
        address: { type: String, required: true },
        hst_gst: { type: String, required: false },
        business_name: { type: String, required: false },
        rate: { type: Number, required: false },
        licence: { type: String, required: true },
        licence_expiry_date: { type: Date, required: true },
        status: {
            type: String,
            enum: ["Active", "Inactive", "Suspended"],
            default: "Active"
        },
        trainings: { type: [String], required: false },
        role: { type: String, required: false },
        username: { type: String, unique: true, required: true },
        password: { type: String, required: true }
    },
    { timestamps: true }
);

export default mongoose.model("Drivers", driverSchema);