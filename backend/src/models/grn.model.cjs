module.exports = (mongoose) => {
  if (mongoose.models.GRN) return;

  const lineSchema = new mongoose.Schema(
    {
      item: String,
      receivedQty: Number,
      pendingQty: Number,
      remark: String,
    },
    { _id: false }
  );

  const schema = new mongoose.Schema(
    {
      grnNo: { type: String, unique: true },
      poId: String,
      requisitionId: String,
      vendor: String,
      resort: String,
      store: String,
      grnDate: Date,
      status: { type: String, default: "CREATED" },
      items: [lineSchema],
    },
    { timestamps: true }
  );

  mongoose.model("GRN", schema);
};
