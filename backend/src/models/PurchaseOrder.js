import mongoose from "mongoose";

const poItemSchema = new mongoose.Schema(
  {
    item: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },
    qty: { type: Number, required: true },
    rate: { type: Number, required: true },
  },
  { _id: false }
);

const poSchema = new mongoose.Schema(
  {
    resort: { type: mongoose.Schema.Types.ObjectId, ref: "Resort", required: true },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", required: true },
    poNumber: { type: String, required: true, unique: true },
    poDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["OPEN", "PART_RECEIVED", "CLOSED", "CANCELLED"],
      default: "OPEN",
    },
    requisition: { type: mongoose.Schema.Types.ObjectId, ref: "Requisition" },
    items: [poItemSchema],
  },
  { timestamps: true }
);

const PurchaseOrder = mongoose.model("PurchaseOrder", poSchema);
export default PurchaseOrder;
