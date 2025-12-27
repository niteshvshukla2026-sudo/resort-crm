module.exports = (mongoose) => {
  if (mongoose.models.Item) return;

  const schema = new mongoose.Schema(
    {
      name: { type: String, required: true },
      code: { type: String, required: true },
      itemCategory: { type: String },
      uom: String,
      brand: String,
      indicativePrice: Number,
      stockByStore: { type: Map, of: Number, default: {} },
    },
    { timestamps: true }
  );

  mongoose.model("Item", schema);
};
