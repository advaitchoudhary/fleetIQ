const Contact = require("../model/contactModel.js");
const { getOrgFilter } = require("../middleware/authMiddleware.js");

const submitContactForm = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !name.trim() || !email || !email.trim() || !message || !message.trim()) {
      return res.status(400).json({ message: "Name, email, and message are required." });
    }

    // Attach organizationId if the submitter is authenticated (driver or admin)
    const organizationId = req.user?.organizationId || null;

    const newContact = new Contact({ name: name.trim(), email: email.trim(), message: message.trim(), organizationId });
    await newContact.save();

    res.status(200).json({ message: "Received" });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    console.error("Error saving contact form:", error);
    res.status(500).json({ message: "Error saving contact form" });
  }
};

const getAllContacts = async (req, res) => {
  try {
    const orgFilter = getOrgFilter(req);
    const contacts = await Contact.find(orgFilter).sort({ createdAt: -1 });
    res.status(200).json(contacts);
  } catch (error) {
    console.error("Error fetching contacts:", error);
    res.status(500).json({ message: "Error fetching contacts" });
  }
};

module.exports = {
  submitContactForm,
  getAllContacts,
};
