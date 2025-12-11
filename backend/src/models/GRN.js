const mongoose = require("mongoose");

const grnItemSchema = new mongoose.Schema({
  item: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },
  qtyRequested: { type: Number, required: true },
  qtyReceived: { type: Number, required: true },
  remark: { type: String, default: "" },
});

const grnSchema = new mongoose.Schema(
  {
    grnNo: { type: String, required: true, unique: true },

    requisition: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Requisition",
    },

    po: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PO",
      default: null,
    },

    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },

    receivedBy: { type: String, default: "" },
    receivedDate: { type: Date, required: true },

    challanNo: { type: String, required: true },
    billNo: { type: String },

    items: [grnItemSchema],

    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("GRN", grnSchema);
