const mongoose = require("mongoose");

const lineSchema = new mongoose.Schema({
  itemCategory: { type: mongoose.Schema.Types.ObjectId, ref: "ItemCategory" },
  item: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },
  qty: { type: Number, required: true },
  remark: { type: String, trim: true },
});

const requisitionSchema = new mongoose.Schema(
  {
    requisitionNo: { type: String, trim: true },

    type: {
      type: String,
      enum: ["INTERNAL", "VENDOR"],
      required: true,
    },

    // INTERNAL REQUISITION (Store → Store)
    fromStore: { type: mongoose.Schema.Types.ObjectId, ref: "Store" },
    toStore: { type: mongoose.Schema.Types.ObjectId, ref: "Store" },

    // VENDOR REQUISITION (Store → Vendor)
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" },
    store: { type: mongoose.Schema.Types.ObjectId, ref: "Store" },

    // 🔥 MANDATORY FOR RESORT FILTERING
    resort: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resort",
      required: true,
      index: true,            // makes filtering super fast
    },

    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },

    requiredBy: { type: Date },

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

    // Relations
    po: { type: mongoose.Schema.Types.ObjectId, ref: "PO" },
    grn: { type: mongoose.Schema.Types.ObjectId, ref: "GRN" },

    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Strong resort index for fast filtering everywhere
requisitionSchema.index({ resort: 1 });
requisitionSchema.index({ status: 1 });

module.exports = mongoose.model("Requisition", requisitionSchema);
