// backend/src/models/StoreTransferRule.js
import mongoose from "mongoose";

const storeTransferRuleSchema = new mongoose.Schema(
  {
    resort: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resort",
      // null / undefined => global rule (all resorts)
    },
    fromStore: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },
    toStore: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },
    isAllowed: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// unique combination
storeTransferRuleSchema.index(
  { resort: 1, fromStore: 1, toStore: 1 },
  { unique: true }
);

const StoreTransferRule = mongoose.model(
  "StoreTransferRule",
  storeTransferRuleSchema
);

export default StoreTransferRule;
