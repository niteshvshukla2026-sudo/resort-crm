const mongoose = require("mongoose");

const lineSchema = new mongoose.Schema({
  itemCategory: { type: mongoose.Schema.Types.ObjectId, ref: "ItemCategory" },
  item: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },
  qty: { type: Number, required: true },
  remark: String,
});

const requisitionSchema = new mongoose.Schema(
  {
    requisitionNo: String,
    type: { type: String, enum: ["INTERNAL", "VENDOR"], required: true },

    // INTERNAL
    fromStore: { type: mongoose.Schema.Types.ObjectId, ref: "Store" },
    toStore: { type: mongoose.Schema.Types.ObjectId, ref: "Store" },

    // VENDOR
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" },
    store: { type: mongoose.Schema.Types.ObjectId, ref: "Store" },

    resort: { type: mongoose.Schema.Types.ObjectId, ref: "Resort" },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },

    requiredBy: Date,
    status: {
      type: String,
      enum: [
        "PENDING",
        "APPROVED",
        "ON_HOLD",
        "REJECTED",
        "PO_CREATED",
        "GRN_CREATED",
      ],
      default: "PENDING",
    },

    lines: [lineSchema],

    po: { type: mongoose.Schema.Types.ObjectId, ref: "PO" },
    grn: { type: mongoose.Schema.Types.ObjectId, ref: "GRN" },

    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Requisition", requisitionSchema);
