const express = require("express");

const {
  create,
  getAllDrivers,
  getDriverById,
  updateDriverById,
  deleteDriverById,
  checkUsername,
  changePassword,
  driverLogin,
  updateAllDriversHours,
  uploadRequiredForm,
  uploadOnboardingForm,
  uploadTrainingProofDocument,
  uploadTrainingProof,
  uploadComplianceDocument,
  uploadComplianceDoc,
} = require("../controller/driverController.js");

const { protect, authorizeRoles } = require("../middleware/authMiddleware.js");
const { requireDriverModule } = require("../middleware/featureGate.js");

const route = express.Router();

route.post("/", protect, authorizeRoles("admin", "company_admin", "dispatcher"), requireDriverModule, create);
route.get("/", protect, requireDriverModule, getAllDrivers);
route.put("/:id", protect, authorizeRoles("admin", "company_admin", "dispatcher"), requireDriverModule, updateDriverById);
route.delete("/:id", protect, authorizeRoles("admin", "company_admin"), requireDriverModule, deleteDriverById);
route.get("/check", checkUsername);
route.get("/:id", protect, requireDriverModule, getDriverById);
route.post(
  "/change-password",
  protect,
  authorizeRoles("driver", "admin", "company_admin"),
  changePassword
);
route.post("/login", driverLogin);
route.post("/update-hours", protect, authorizeRoles("admin"), updateAllDriversHours);
route.post(
  "/upload-required-form",
  protect,
  authorizeRoles("driver", "admin"),
  (req, res, next) => {
    uploadOnboardingForm.single("file")(req, res, (err) => {
      if (err) {
        // Handle multer errors (fileFilter errors, etc.)
        if (err.message && err.message.includes("file type")) {
          return res.status(400).json({ message: err.message || "Invalid file type" });
        }
        return res.status(400).json({ message: err.message || "File upload error" });
      }
      next();
    });
  },
  uploadRequiredForm
);
route.post(
  "/upload-training-proof",
  protect,
  authorizeRoles("driver", "admin"),
  uploadTrainingProof.single("file"),
  uploadTrainingProofDocument
);

route.post(
  "/upload-compliance-document",
  protect,
  authorizeRoles("driver", "admin", "company_admin"),
  uploadComplianceDoc.single("file"),
  uploadComplianceDocument
);

module.exports = route;