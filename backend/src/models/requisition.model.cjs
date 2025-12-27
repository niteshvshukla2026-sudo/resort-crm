module.exports = (mongoose) => {
  if (mongoose.models.Requisition) return;

  const lineSchema = new mongoose.Schema(
    {
      item: String,
      qty: Number,
      remark: String,
    },
    { _id: false }
  );

  const schema = new mongoose.Schema(
    {
      requisitionNo: { type: String, unique: true },
      type: String,
      resort: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Resort",
      },
      department: String,
      fromStore: String,
      toStore: String,
      vendor: String,
      store: String,
      requiredBy: Date,
      status: String,
      lines: [lineSchema],
      createdBy: String,
      approvedBy: String,
      approvedAt: Date,
      rejectedBy: String,
      rejectionReason: String,
    },
    { timestamps: true }
  );

  mongoose.model("Requisition", schema);
};
