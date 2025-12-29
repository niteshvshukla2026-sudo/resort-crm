const mongoose = require("mongoose");

const permissionSchema = new mongoose.Schema(
  {
    module: { type: String, required: true }, // USERS, ITEMS, GRN etc
    actions: [{ type: String }], // CREATE, READ, UPDATE, DELETE, APPROVE
  },
  { _id: false }
);

const roleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    key: {
      type: String,
      required: true,
      uppercase: true,
      unique: true,
    },

    description: { type: String },

    type: {
      type: String,
      enum: ["SYSTEM", "CUSTOM"],
      default: "CUSTOM",
    },

    storeMode: {
      type: String,
      enum: ["SINGLE", "MULTI"],
      default: "MULTI",
    },

    permissions: [permissionSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Role", roleSchema);
