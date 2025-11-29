import mongoose from "mongoose";

const requisitionItemSchema = new mongoose.Schema(
  {
    item: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },
    qtyRequested: { type: Number, required: true },
    qtyApproved: { type: Number, default: 0 },
    remark: String,
  },
  { _id: false }
);

const requisitionSchema = new mongoose.Schema(
  {
    resort: { type: mongoose.Schema.Types.ObjectId, ref: "Resort", required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department", required: true },
    reqNumber: { type: String, required: true, unique: true },
    reqDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["DRAFT", "SUBMITTED", "APPROVED", "REJECTED"],
      default: "SUBMITTED",
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    items: [requisitionItemSchema],
  },
  { timestamps: true }
);

const Requisition = mongoose.model("Requisition", requisitionSchema);
export default Requisition;
