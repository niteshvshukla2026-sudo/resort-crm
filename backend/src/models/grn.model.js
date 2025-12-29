import mongoose from "mongoose";

const GRNLineSchema = new mongoose.Schema(
  {
    item: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },

    receivedQty: { type: Number, required: true },

    pendingQty: { type: Number, default: 0 },

    remark: { type: String },
  },
  { _id: false }
);

const GRNSchema = new mongoose.Schema(
  {
    grnNo: { type: String, required: true, unique: true },

    requisitionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Requisition",
    },

    poId: { type: mongoose.Schema.Types.ObjectId, ref: "PO" },

    vendor: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" },

    resort: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resort",
      required: true,
    },

    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },

    grnDate: { type: Date, default: Date.now },

    status: {
      type: String,
      enum: ["OPEN", "CLOSED"],
      default: "OPEN",
    },

    items: [GRNLineSchema],
  },
  { timestamps: true }
);

export default mongoose.model("GRN", GRNSchema);
