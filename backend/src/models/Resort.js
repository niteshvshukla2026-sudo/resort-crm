const mongoose = require("mongoose");

const resortSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Resort || mongoose.model("Resort", resortSchema);
