module.exports = (mongoose) => {
  const schema = new mongoose.Schema({
    name: String,
    code: String,
    departmentCategory: String,
  }, { timestamps: true });

  mongoose.models.ItemCategory || mongoose.model("ItemCategory", schema);
};