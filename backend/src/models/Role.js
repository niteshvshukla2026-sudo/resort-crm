// backend/src/models/Role.js
import mongoose from "mongoose";

const permissionSchema = new mongoose.Schema(
  {
    module: { type: String, required: true },   // e.g. "REQUISITIONS"
    actions: [{ type: String }],               // e.g. ["VIEW","CREATE"]
  },
  { _id: false }
);

const roleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },           // "Resort Admin"
    key: { type: String, required: true, unique: true }, // "RESORT_ADMIN"
    type: {
      type: String,
      enum: ["SYSTEM", "CUSTOM"],
      default: "CUSTOM",
    },
    description: String,
    permissions: [permissionSchema],
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Role = mongoose.model("Role", roleSchema);
export default Role;
