// backend/src/models/resort.model.js
import mongoose from "mongoose";

const ResortSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, trim: true, index: true },
  address: { type: String, required: true },
  locationZone: { type: String, required: true, index: true }, // city/district
  ownerName: { type: String, required: true },
  ownerContact: { type: String, required: true }, // store digits only
  ownerEmail: { type: String, trim: true },
  ownerResdAddress: { type: String },
  ownerOffAddress: { type: String },
  noOfKeys: { type: Number },
  tieUpCategory: { type: String },
  qualityCategory: { type: String },
  locationCategory: { type: String },
  fssaiNumber: { type: String },
  fssaiStatus: { type: String, enum: ["active","expired","pending",""] , default: "" },
  renewalDate: { type: Date },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model("Resort", ResortSchema);
