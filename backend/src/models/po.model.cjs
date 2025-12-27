module.exports = (mongoose) => {
  if (mongoose.models.PO) return;

  const lineSchema = new mongoose.Schema(
    {
      item: String,
      qty: Number,
      rate: Number,
      amount: Number,
      remark: String,
    },
    { _id: false }
  );

  const schema = new mongoose.Schema(
    {
      poNo: { type: String, unique: true },
      requisitionId: String,
      vendor: String,
      resort: String,
      deliverTo: String,
      poDate: Date,
      items: [lineSchema],
      subTotal: Number,
      taxPercent: Number,
      taxAmount: Number,
      total: Number,
      status: String,
    },
    { timestamps: true }
  );

  mongoose.model("PO", schema);
};
