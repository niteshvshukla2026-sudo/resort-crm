import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema(
  {
    resort: { type: mongoose.Schema.Types.ObjectId, ref: "Resort", required: true },
    name: { type: String, required: true },
    code: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Department = mongoose.model("Department", departmentSchema);
export default Department;
