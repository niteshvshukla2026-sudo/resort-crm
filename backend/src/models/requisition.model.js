import mongoose from "mongoose";

const RequisitionLineSchema = new mongoose.Schema(
  {
    itemCategory: { type: String }, // id or name (frontend compatible)
    item: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },
    qty: { type: Number, required: true },
    remark: { type: String },
  },
  { _id: false }
);

const RequisitionSchema = new mongoose.Schema(
  {
    requisitionNo: { type: String, required: true, unique: true },

    type: {
      type: String,
      enum: ["INTERNAL", "VENDOR"],
      default: "INTERNAL",
    },

    resort: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resort",
      required: true,
    },

    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },

    fromStore: { type: mongoose.Schema.Types.ObjectId, ref: "Store" },
    toStore: { type: mongoose.Schema.Types.ObjectId, ref: "Store" },

    store: { type: mongoose.Schema.Types.ObjectId, ref: "Store" }, // vendor req

    vendor: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" },

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

    lines: [RequisitionLineSchema],

    po: { type: mongoose.Schema.Types.ObjectId, ref: "PO" },
    grn: { type: mongoose.Schema.Types.ObjectId, ref: "GRN" },

    approvedBy: { type: String },
    approvedAt: { type: Date },

    rejectedBy: { type: String },
    rejectionReason: { type: String },

    createdBy: { type: String, default: "SYSTEM" },
  },
  { timestamps: true }
);

export default mongoose.model("Requisition", RequisitionSchema);
