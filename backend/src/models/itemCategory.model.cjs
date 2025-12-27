module.exports = function (mongoose) {
  const ItemCategorySchema = new mongoose.Schema(
    {
      name: {
        type: String,
        required: true,
        trim: true,
      },

      code: {
        type: String,
        required: true,
        trim: true,
        unique: true,
      },

      // we store department reference loosely (id / code / name)
      // because frontend sends any of these
      departmentCategory: {
        type: String,
        required: true,
      },
    },
    { timestamps: true }
  );

  return (
    mongoose.models.ItemCategory ||
    mongoose.model("ItemCategory", ItemCategorySchema)
  );
};
