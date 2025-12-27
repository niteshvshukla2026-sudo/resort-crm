module.exports = function (mongoose) {
  const RecipeLineSchema = new mongoose.Schema(
    {
      itemId: {
        type: mongoose.Schema.Types.Mixed, // string or ObjectId
        required: true,
      },
      itemCategory: {
        type: String, // item category id / name
        required: true,
      },
      qty: {
        type: Number,
        required: true,
        min: 0,
      },
    },
    { _id: false }
  );

  const RecipeSchema = new mongoose.Schema(
    {
      code: {
        type: String,
        required: true,
        trim: true,
        unique: true,
      },

      name: {
        type: String,
        required: true,
        trim: true,
      },

      // UI sends RECIPE_CATEGORIES ids
      recipeCategoryId: {
        type: String,
        required: true,
      },

      // internal type (RECIPE_PORTION / RECIPE_LUMPSUM)
      type: {
        type: String,
      },

      yieldQty: {
        type: Number,
      },

      yieldUom: {
        type: String,
      },

      lines: {
        type: [RecipeLineSchema],
        default: [],
      },
    },
    { timestamps: true }
  );

  return mongoose.models.Recipe || mongoose.model("Recipe", RecipeSchema);
};
