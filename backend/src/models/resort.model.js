const mongoose = require("mongoose");

const ResortSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true },

    address: { type: String, required: true },
    locationZone: { type: String, required: true },

    ownerName: { type: String, required: true },
    ownerContact: { type: String, required: true },
    ownerEmail: { type: String },
    ownerResdAddress: { type: String },
    ownerOffAddress: { type: String },

    noOfKeys: { type: Number },

    tieUpCategory: { type: String },
    qualityCategory: { type: String },
    locationCategory: { type: String },

    fssaiNumber: { type: String },
    fssaiStatus: { type: String },
    renewalDate: { type: Date },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ✅ EXPORT MODEL (IMPORTANT)
module.exports =
  mongoose.models.Resort ||
  mongoose.model("Resort", ResortSchema);
