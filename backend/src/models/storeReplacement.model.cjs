module.exports = (mongoose) => {
  if (mongoose.models.StoreReplacement) return;

  const lineSchema = new mongoose.Schema(
    {
      itemId: String,
      qty: Number,
      issuedQty: { type: Number, default: 0 },
      remark: String,
    },
    { _id: false }
  );

  const schema = new mongoose.Schema(
    {
      replNo: String,
      resort: String,
      storeId: String,
      vendorId: String,
      status: {
        type: String,
        enum: ["OPEN", "SENT_TO_VENDOR", "CLOSED"],
        default: "OPEN",
      },
      lines: [lineSchema],
    },
    { timestamps: true }
  );

  mongoose.model("StoreReplacement", schema);
};
