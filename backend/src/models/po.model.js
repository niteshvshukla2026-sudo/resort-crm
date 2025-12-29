import mongoose from "mongoose";

const POLineSchema = new mongoose.Schema(
  {
    item: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },
    qty: { type: Number, required: true },
    rate: { type: Number, default: 0 },
    amount: { type: Number, default: 0 },
    remark: { type: String },
  },
  { _id: false }
);

const POSchema = new mongoose.Schema(
  {
    poNo: { type: String, required: true, unique: true },

    requisitionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Requisition",
    },

    vendor: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" },

    resort: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resort",
      required: true,
    },

    deliverTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },

    poDate: { type: Date, default: Date.now },

    items: [POLineSchema],

    subTotal: { type: Number, default: 0 },
    taxPercent: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    total: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ["OPEN", "PARTIAL", "CLOSED"],
      default: "OPEN",
    },
  },
  { timestamps: true }
);

export default mongoose.model("PO", POSchema);
