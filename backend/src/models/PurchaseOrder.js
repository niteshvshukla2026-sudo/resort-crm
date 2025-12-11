const mongoose = require("mongoose");

const poItemSchema = new mongoose.Schema({
  item: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },
  qty: { type: Number, required: true },
  rate: { type: Number, required: true },
  amount: { type: Number, required: true },
  remark: { type: String, default: "" },
});

const poSchema = new mongoose.Schema(
  {
    poNo: { type: String, required: true, unique: true },

    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },

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

    items: [poItemSchema],

    subTotal: { type: Number, default: 0 },
    taxPercent: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    total: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ["CREATED", "PARTIAL_GRN", "FULLY_RECEIVED", "CANCELLED"],
      default: "CREATED",
    },

    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PO", poSchema);
