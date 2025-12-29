import mongoose from "mongoose";

const ConsumptionLineSchema = new mongoose.Schema(
  {
    item: { type: mongoose.Schema.Types.ObjectId, ref: "Item" },
    recipe: { type: mongoose.Schema.Types.ObjectId, ref: "Recipe" },
    qty: { type: Number, required: true },
    uom: String,
    category: { type: mongoose.Schema.Types.ObjectId, ref: "ItemCategory" },
    remarks: String,
  },
  { _id: false }
);

const ConsumptionSchema = new mongoose.Schema(
  {
    resort: { type: mongoose.Schema.Types.ObjectId, ref: "Resort", required: true },
    type: {
      type: String,
      enum: ["LUMPSUM", "RECIPE_LUMPSUM", "RECIPE_PORTION"],
      required: true,
    },
    storeFrom: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },
    date: { type: Date, default: Date.now },
    notes: String,
    lines: [ConsumptionLineSchema],
    status: { type: String, default: "POSTED" },
  },
  { timestamps: true }
);

export default mongoose.model("Consumption", ConsumptionSchema);
