import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String, unique: true },
    category: String,
    uom: { type: String, required: true },
    minLevel: { type: Number, default: 0 },
    maxLevel: { type: Number, default: 0 },
    reorderLevel: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Item = mongoose.model("Item", itemSchema);
export default Item;
