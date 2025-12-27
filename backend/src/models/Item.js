import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    // link to ItemCategory master
    itemCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ItemCategory",
    },
    uom: {
      type: String,
      required: true,
      trim: true,
    },
    brand: {
      type: String,
      trim: true,
    },
    indicativePrice: {
      type: Number,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Item", itemSchema);
