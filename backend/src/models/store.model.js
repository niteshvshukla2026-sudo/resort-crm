const mongoose = require("mongoose");

const StoreSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String },

    resort: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resort",
      required: true,
    },

    description: { type: String },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ✅ SAME PATTERN AS RESORT
module.exports =
  mongoose.models.Store ||
  mongoose.model("Store", StoreSchema);
