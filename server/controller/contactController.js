import Contact from "../model/contactModel.js";

export const submitContactForm = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    const newContact = new Contact({ name, email, message });
    await newContact.save();

    console.log("Received contact form:", { name, email, message });
    res.status(200).json({ message: "Received" });
  } catch (error) {
    console.error("Error saving contact form:", error);
    res.status(500).json({ message: "Error saving contact form" });
  }
};

export const getAllContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    console.log("Fetched contacts from MongoDB:", contacts); // Debugging MongoDB retrieval
    res.status(200).json(contacts);
  } catch (error) {
    console.error("Error fetching contacts:", error);
    res.status(500).json({ message: "Error fetching contacts" });
  }
};