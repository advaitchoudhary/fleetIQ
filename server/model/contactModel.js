const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
    },
    name: { type: String, required: true, trim: true, minlength: 1 },
    email: {
      type: String,
      required: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    message: { type: String, required: true, trim: true, minlength: 1 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Contact", contactSchema);
