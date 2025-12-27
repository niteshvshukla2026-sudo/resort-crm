module.exports = (mongoose) => {
  if (mongoose.models.ItemCategory) return;

  const schema = new mongoose.Schema(
    {
      name: { type: String, required: true },
      code: { type: String, required: true },
      departmentCategory: { type: String, default: "" },
    },
    { timestamps: true }
  );

  mongoose.model("ItemCategory", schema);
};
