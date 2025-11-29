import mongoose from "mongoose";

const grnItemSchema = new mongoose.Schema(
  {
    item: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },
    qty: { type: Number, required: true },
    rate: { type: Number, required: true },
  },
  { _id: false }
);

const grnSchema = new mongoose.Schema(
  {
    resort: { type: mongoose.Schema.Types.ObjectId, ref: "Resort", required: true },
    store: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", required: true },
    po: { type: mongoose.Schema.Types.ObjectId, ref: "PurchaseOrder" },
    grnNumber: { type: String, required: true, unique: true },
    grnDate: { type: Date, default: Date.now },
    items: [grnItemSchema],
  },
  { timestamps: true }
);

const GRN = mongoose.model("GRN", grnSchema);
export default GRN;
