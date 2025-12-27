module.exports = (mongoose) => {
  if (mongoose.models.Recipe) return;

  const lineSchema = new mongoose.Schema(
    {
      itemId: String,
      qty: Number,
      itemCategory: String,
    },
    { _id: false }
  );

  const schema = new mongoose.Schema(
    {
      code: String,
      name: String,
      recipeCategoryId: String,
      type: String,
      yieldQty: Number,
      yieldUom: String,
      lines: [lineSchema],
    },
    { timestamps: true }
  );

  mongoose.model("Recipe", schema);
};
