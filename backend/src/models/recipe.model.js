module.exports = (mongoose) => {
  const lineSchema = new mongoose.Schema(
    {
      itemId: { type: String, required: true },
      qty: { type: Number, required: true },

      // tolerate all variants
      itemCategory: { type: String },
      itemCategoryId: { type: String },
      categoryId: { type: String },
    },
    { _id: false }
  );

  const schema = new mongoose.Schema(
    {
      code: { type: String, required: true, index: true },
      name: { type: String, required: true },

      // frontend driven (BY_PORTION / BY_RECIPE_LUMPSUM)
      recipeCategoryId: { type: String },
      recipeCategory: { type: String }, // backward compat
      type: { type: String },

      yieldQty: { type: Number },
      yieldUom: { type: String },

      lines: [lineSchema],
    },
    { timestamps: true }
  );

  mongoose.models.Recipe || mongoose.model("Recipe", schema);
};
