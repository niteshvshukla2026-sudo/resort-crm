const mongoose = require("mongoose");

const grnItemSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Item",
    required: true,
  },
  qtyRequested: {
    type: Number,
    default: 0,
  },
  qtyReceived: {
    type: Number,
    default: 0,
  },
  remark: String,
});

const grnSchema = new mongoose.Schema(
  {
    grnNo: {
      type: String,
      required: true,
      trim: true,
    },

    // 🔗 ALWAYS linked to requisition
    requisition: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Requisition",
      required: true,
    },

    // 🟡 OPTIONAL: only when GRN is created FROM PO
    poId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PurchaseOrder",
      required: false, // ✅ VERY IMPORTANT (fixes your error)
      default: null,
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

    receivedBy: {
      type: String,
      trim: true,
    },

    receivedDate: {
      type: Date,
      required: true,
    },

    challanNo: {
      type: String,
      required: true,
      trim: true,
    },

    billNo: {
      type: String,
      trim: true,
    },

    items: {
      type: [grnItemSchema],
      validate: [
        (v) => Array.isArray(v) && v.length > 0,
        "GRN must have at least one item",
      ],
    },

    status: {
      type: String,
      enum: ["CREATED", "POSTED", "CANCELLED"],
      default: "CREATED",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Grn", grnSchema);
