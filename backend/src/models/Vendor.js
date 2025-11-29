import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String, unique: true },
    contactPerson: String,
    phone: String,
    email: String,
    gstNumber: String,
    address: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Vendor = mongoose.model("Vendor", vendorSchema);
export default Vendor;
