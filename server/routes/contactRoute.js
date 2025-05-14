import express from "express";
import { submitContactForm, getAllContacts } from "../controller/contactController.js";

const router = express.Router();

router.post("/contact", submitContactForm);
router.get("/contact", getAllContacts);

export default router;