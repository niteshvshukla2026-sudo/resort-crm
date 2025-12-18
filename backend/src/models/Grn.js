const mongoose = require("mongoose");

const grnItemSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Item",
    required: true,
  },
  qtyRequested: { type: Number, default: 0 },
  qtyReceived: { type: Number, default: 0 },
  remark: { type: String, default: "" },
});

const grnSchema = new mongoose.Schema(
  {
    grnNo: { type: String, required: true },

    // 🔴 IMPORTANT: poId OPTIONAL
    poId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PurchaseOrder",
      required: false,
      default: null,
    },

    requisition: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Requisition",
      required: true,
    },

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

    receivedBy: String,
    receivedDate: { type: Date, required: true },
    challanNo: { type: String, required: true },
    billNo: String,

    items: [grnItemSchema],

    status: { type: String, default: "CREATED" },
  },
  { timestamps: true }
);

/**
 * 🔥 VERY IMPORTANT
 * model name CHANGE kiya to avoid mongoose cache
 */
module.exports = mongoose.model("GrnNew", grnSchema);
