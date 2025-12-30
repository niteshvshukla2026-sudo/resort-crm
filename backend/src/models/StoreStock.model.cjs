const mongoose = require("mongoose");

const storeStockSchema = new mongoose.Schema(
  {
    resort: { type: String, required: true },
    store: { type: String, required: true },
    item: { type: String, required: true },
    qty: { type: Number, default: 0 },
  },
  { timestamps: true }
);

storeStockSchema.index(
  { resort: 1, store: 1, item: 1 },
  { unique: true }
);

module.exports =
  mongoose.models.StoreStock ||
  mongoose.model("StoreStock", storeStockSchema);
