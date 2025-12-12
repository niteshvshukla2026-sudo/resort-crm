import mongoose from "mongoose";

const ResortSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, trim: true },

    address: { type: String, required: true, trim: true },
    locationZone: { type: String, required: true, trim: true },

    ownerName: { type: String, required: true, trim: true },
    ownerContact: { type: String, required: true, trim: true },
    ownerEmail: { type: String, trim: true },

    ownerResdAddress: { type: String, trim: true },
    ownerOffAddress: { type: String, trim: true },

    noOfKeys: { type: Number, default: 0 },

    tieUpCategory: { type: String, trim: true },
    qualityCategory: { type: String, trim: true },
    locationCategory: { type: String, trim: true },

    fssaiNumber: { type: String, trim: true },
    fssaiStatus: { type: String, trim: true },
    renewalDate: { type: String, trim: true },

    // VERY IMPORTANT → used for frontend filtering
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Strong indexes for faster resort lookup
ResortSchema.index({ code: 1 }, { unique: true });
ResortSchema.index({ name: 1 });

export default mongoose.model("Resort", ResortSchema);
