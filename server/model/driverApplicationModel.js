const mongoose = require("mongoose");

const driverApplicationSchema = new mongoose.Schema(
    {
        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            default: null,
        },
        // Personal Information
        name: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String, required: true },
        address: { type: String, required: true },
        sinNo: { type: String, required: true },
        
        // License Information
        licenseClass: { type: String, required: true },
        licenseExpiryDate: { type: Date, required: true },
        licenseFront: { type: String, required: true }, // File path
        licenseBack: { type: String, required: true }, // File path
        
        // Experience
        truckingExperienceYears: { type: Number, required: true, default: 0 },
        truckingExperienceMonths: { type: Number, required: true, default: 0 },
        
        // Application Form
        applicationForm: { type: String, required: true }, // File path
        
        // PCE Consent Form (required for submission/approval, but not for rejection)
        pceConsentForm: { type: String, required: true }, // File path
        
        // Optional Documents
        cvor: { type: String, required: false }, // File path
        driversAbstract: { type: String, required: false }, // File path
        
        // Status
        status: {
            type: String,
            enum: ["Pending", "Approved", "Rejected"],
            default: "Pending"
        },
        
        // Admin notes (optional)
        adminNotes: { type: String, required: false },
        
        // Preferred start location (if needed)
        preferredStartLocation: { type: String, required: false }
    },
    { timestamps: true } // Adds createdAt and updatedAt timestamps
);

module.exports = mongoose.model("DriverApplication", driverApplicationSchema);



