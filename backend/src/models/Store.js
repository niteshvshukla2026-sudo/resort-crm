// backend/models/storeModel.js
const mongoose = require("mongoose");

const storeSchema = new mongoose.Schema(
  {
    // Resort ko abhi simple string rakh rahe hain
    // Isme tum Resort ka _id ya name dono store kar sakte ho
    resort: {
      type: String,
      required: true,
      trim: true,
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

module.exports = mongoose.model("Store", storeSchema);
