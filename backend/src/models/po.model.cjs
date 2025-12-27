// backend/models/po.model.cjs
module.exports = function (mongoose) {
  const { Schema } = mongoose;

  const lineSchema = new Schema(
    {
      item: { type: Schema.Types.ObjectId, ref: "Item", required: true },
      qty: { type: Number, required: true },
      rate: Number,
      amount: Number,
      remark: String,
    },
    { _id: false }
  );

  const schema = new Schema(
    {
      poNo: { type: String, required: true, unique: true },

      requisition: {
        type: Schema.Types.ObjectId,
        ref: "Requisition",
      },

      vendor: {
        type: Schema.Types.ObjectId,
        ref: "Vendor",
        required: true,
      },

      resort: {
        type: Schema.Types.ObjectId,
        ref: "Resort",
        required: true,
      },

      deliverTo: {
        type: Schema.Types.ObjectId,
        ref: "Store",
        required: true,
      },

      poDate: { type: Date, default: Date.now },

      items: [lineSchema],

      subTotal: Number,
      taxPercent: Number,
      taxAmount: Number,
      total: Number,

      status: {
        type: String,
        enum: ["OPEN", "PARTIAL", "CLOSED"],
        default: "OPEN",
      },

      createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    },
    { timestamps: true }
  );

  return mongoose.models.PO || mongoose.model("PO", schema);
};
