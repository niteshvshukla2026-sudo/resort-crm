module.exports = (mongoose) => {
  const schema = new mongoose.Schema(
    {
      name: { type: String, required: true },
      code: { type: String, required: true },

      // 🔥 string only (department _id / code / name)
      departmentCategory: { type: String, required: true },
    },
    { timestamps: true }
  );

  mongoose.models.ItemCategory ||
    mongoose.model("ItemCategory", schema);
};
