const mongoose = require("mongoose");

// Main schema for driver information including nested rate schema
const driverSchema = new mongoose.Schema(
    {
        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            default: null,
        },
        driverId: { type: String, unique: true, sparse: true }, // Auto-generated: ORG_SEQ_TIMESTAMP
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        contact: { type: String, required: true },
        address: { type: String, required: true },
        hst_gst: { type: String, required: false },
        business_name: { type: String, required: false },
        backhaulRate: { type: Number, required: false },
        bankDetails: {
            bankName: { type: String },
            accountNumber: { type: String },
            transitNumber: { type: String },
            institutionNumber: { type: String }
        },
        comboRate: { type: Number, required: false }, 
        extraSheetEWRate: { type: Number, required: false },
        regularBannerRate: { type: Number, required: false },
        wholesaleRate: { type: Number, required: false },
        voilaRate: { type: Number, required: false },
        tcsLinehaulTrentonRate: { type: Number, required: false },
        licence: { type: String, required: true },
        licence_expiry_date: { type: Date, required: true },
        status: {
            type: String,
            enum: ["Active", "Inactive", "Suspended"],
            default: "Active"
        },
        trainings: [{
            name: { type: String, required: true }, // Training name
            proofDocument: { type: String, required: false } // File path for proof document
        }],
        username: { type: String, unique: true, required: true },
        password: { type: String, required: true },
        workStatus: { type: String, required: true },
        sinNo: { type: String, required: true },
        plainPassword: { type: String },
        hoursThisWeek: { type: Number, default: 0 }, // New field to track hours this week
        requiredOnboardingForms: {
            agencySignOff: { type: String, required: false },
            driverDeliveryExpectations: { type: String, required: false },
            cellPhonePolicy: { type: String, required: false },
            storeSurvey1: { type: String, required: false },
            tobaccoAndLCPValidation: { type: String, required: false },
            driverSop: { type: String, required: false }
        },
        // Stripe Connect fields for direct payouts
        stripeAccountId: { type: String, default: null },
        stripeOnboardingComplete: { type: Boolean, default: false },
    },
    { timestamps: true } // Adds createdAt and updatedAt timestamps
);

module.exports = mongoose.model("Driver", driverSchema);