import mongoose from "mongoose";

const StoreReplacementLineSchema = new mongoose.Schema(
  {
    lineId: { type: String, required: true },
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },
    qty: { type: Number, required: true },        // replacement qty
    issuedQty: { type: Number, default: 0 },      // issued to vendor
    receivedQty: { type: Number, default: 0 },    // received in GRN
    remark: String,
  },
  { _id: false }
);

const StoreReplacementSchema = new mongoose.Schema(
  {
    resort: { type: mongoose.Schema.Types.ObjectId, ref: "Resort", required: true },
    replNo: { type: String, required: true },
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", default: null },
    date: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["OPEN", "SENT_TO_VENDOR", "CLOSED"],
      default: "OPEN",
    },
    lines: [StoreReplacementLineSchema],
  },
  { timestamps: true }
);

export default mongoose.model("StoreReplacement", StoreReplacementSchema);
