const mongoose = require("mongoose");

const storeSchema = new mongoose.Schema(
  {
    // 🔥 Proper Resort reference
    resort: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resort",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  { timestamps: true }
);

// 🔐 Store code must be unique PER RESORT
storeSchema.index({ resort: 1, code: 1 }, { unique: true });

module.exports = mongoose.model("Store", storeSchema);
