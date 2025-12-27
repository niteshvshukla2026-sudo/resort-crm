// backend/models/requisition.model.cjs
module.exports = function (mongoose) {
  const { Schema } = mongoose;

  const lineSchema = new Schema(
    {
      item: { type: Schema.Types.ObjectId, ref: "Item", required: true },
      qty: { type: Number, required: true },
      remark: String,
    },
    { _id: false }
  );

  const schema = new Schema(
    {
      requisitionNo: { type: String, required: true, unique: true },

      type: {
        type: String,
        enum: ["INTERNAL", "VENDOR"],
        required: true,
      },

      resort: {
        type: Schema.Types.ObjectId,
        ref: "Resort",
        required: true,
      },

      department: { type: Schema.Types.ObjectId, ref: "Department" },

      fromStore: { type: Schema.Types.ObjectId, ref: "Store" },
      toStore: { type: Schema.Types.ObjectId, ref: "Store" },

      vendor: { type: Schema.Types.ObjectId, ref: "Vendor" },

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

      createdBy: { type: Schema.Types.ObjectId, ref: "User" },
      approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
      approvedAt: Date,
      rejectedBy: { type: Schema.Types.ObjectId, ref: "User" },
      rejectionReason: String,
    },
    { timestamps: true }
  );

  return mongoose.models.Requisition ||
    mongoose.model("Requisition", schema);
};
