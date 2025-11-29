import mongoose from "mongoose";

const resortSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    location: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Resort = mongoose.model("Resort", resortSchema);
export default Resort;
