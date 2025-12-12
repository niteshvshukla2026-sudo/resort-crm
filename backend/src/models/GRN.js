const mongoose = require("mongoose");

const grnItemSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Item",
    required: true,
  },
  qtyRequested: { type: Number, required: true },
  qtyReceived: { type: Number, required: true },
  remark: { type: String, default: "", trim: true },
});

const grnSchema = new mongoose.Schema(
  {
    grnNo: { type: String, required: true, unique: true, trim: true },

    // 🔗 Requisition (optional, when GRN is from requisition)
    requisition: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Requisition",
    },

    // 🔗 PO (mandatory for most GRNs)
    po: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PO",
      default: null,
      index: true,
    },

    // 🔥 REQUIRED FOR RESORT-WISE FILTERING
    resort: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resort",
      required: true,
      index: true,
    },

    // Store receiving the material
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
      index: true,
    },

    receivedBy: { type: String, default: "", trim: true },
    receivedDate: { type: Date, required: true },

    challanNo: { type: String, required: true, trim: true },
    billNo: { type: String, trim: true },

    items: [grnItemSchema],

    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Add strong indexes for fast dashboards & filtering
grnSchema.index({ resort: 1, receivedDate: -1 });
grnSchema.index({ store: 1 });
grnSchema.index({ po: 1 });

module.exports = mongoose.model("GRN", grnSchema);
