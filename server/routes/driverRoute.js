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
  uploadTrainingProof
} = require("../controller/driverController.js");

const { protect, authorizeRoles } = require("../middleware/authMiddleware.js");

const route = express.Router();

route.post("/", create);
route.get("/", getAllDrivers);
route.put("/:id", updateDriverById);
route.delete("/:id", deleteDriverById);
route.get("/check", checkUsername);
route.get("/:id", getDriverById);
route.post(
  "/change-password",
  protect,
  authorizeRoles("driver", "admin"),
  changePassword
);
route.post("/login", driverLogin);
route.post("/update-hours", protect, authorizeRoles("admin"), updateAllDriversHours);
route.post(
  "/upload-required-form",
  protect,
  authorizeRoles("driver", "admin"),
  uploadOnboardingForm.single("file"),
  uploadRequiredForm
);
route.post(
  "/upload-training-proof",
  protect,
  authorizeRoles("driver", "admin"),
  uploadTrainingProof.single("file"),
  uploadTrainingProofDocument
);

module.exports = route;