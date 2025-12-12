// backend/models/storeModel.js
const mongoose = require("mongoose");

const storeSchema = new mongoose.Schema(
  {
    // 🔥 Resort MUST be ObjectId for filtering & linking
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
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Fast search by resort + name
storeSchema.index({ resort: 1, name: 1 });

module.exports = mongoose.model("Store", storeSchema);
