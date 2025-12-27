// backend/models/grn.model.cjs
module.exports = function (mongoose) {
  const { Schema } = mongoose;

  const lineSchema = new Schema(
    {
      item: { type: Schema.Types.ObjectId, ref: "Item", required: true },
      receivedQty: { type: Number, required: true },
      pendingQty: { type: Number, default: 0 },
      remark: String,
    },
    { _id: false }
  );

  const schema = new Schema(
    {
      grnNo: { type: String, required: true, unique: true },

      po: { type: Schema.Types.ObjectId, ref: "PO" },
      requisition: { type: Schema.Types.ObjectId, ref: "Requisition" },

      vendor: { type: Schema.Types.ObjectId, ref: "Vendor" },

      resort: {
        type: Schema.Types.ObjectId,
        ref: "Resort",
        required: true,
      },

      store: {
        type: Schema.Types.ObjectId,
        ref: "Store",
        required: true,
      },

      grnDate: { type: Date, default: Date.now },

      status: {
        type: String,
        enum: ["CREATED", "CLOSED"],
        default: "CREATED",
      },

      items: [lineSchema],

      receivedBy: { type: Schema.Types.ObjectId, ref: "User" },
    },
    { timestamps: true }
  );

  return mongoose.models.GRN || mongoose.model("GRN", schema);
};
