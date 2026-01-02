const mongoose = require("mongoose");

const storeStockSchema = new mongoose.Schema(
  {
    store: { type: String, required: true },
    item: { type: String, required: true },
    qty: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// unique stock per store + item
storeStockSchema.index({ store: 1, item: 1 }, { unique: true });

module.exports =
  mongoose.models.StoreStock ||
  mongoose.model("StoreStock", storeStockSchema);
