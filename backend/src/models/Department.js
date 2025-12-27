// backend/src/models/department.model.js
import mongoose from "mongoose";

const DepartmentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, trim: true, index: true, unique: true },
}, { timestamps: true });

// ensure unique code lowercase index as well (optional)
// DepartmentSchema.index({ code: 1 }, { unique: true });

export default mongoose.model("Department", DepartmentSchema);
