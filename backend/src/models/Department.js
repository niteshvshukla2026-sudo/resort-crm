import mongoose from "mongoose";

const DepartmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    code: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    // 🔥 RESORT LINK (MOST IMPORTANT)
    resort: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resort",
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  { timestamps: true }
);

// 🔐 Unique department code PER RESORT
DepartmentSchema.index({ code: 1, resort: 1 }, { unique: true });

export default mongoose.model("Department", DepartmentSchema);
