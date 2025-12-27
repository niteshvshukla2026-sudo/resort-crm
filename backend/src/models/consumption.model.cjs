module.exports = (mongoose) => {
  if (mongoose.models.Consumption) return;

  const lineSchema = new mongoose.Schema(
    {
      item: String,
      recipe: String,
      qty: Number,
      category: String,
      uom: String,
      remarks: String,
    },
    { _id: false }
  );

  const schema = new mongoose.Schema(
    {
      date: { type: Date, default: Date.now },
      type: String,
      eventName: String,
      menuName: String,
      resort: String,
      storeFrom: String,
      storeTo: String,
      lines: [lineSchema],
      notes: String,
    },
    { timestamps: true }
  );

  mongoose.model("Consumption", schema);
};
