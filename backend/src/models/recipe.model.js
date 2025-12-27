module.exports = (mongoose) => {
  const schema = new mongoose.Schema({
    code: String,
    name: String,
    recipeCategoryId: String,
    type: String,
    yieldQty: Number,
    yieldUom: String,
    lines: Array,
  }, { timestamps: true });

  mongoose.models.Recipe || mongoose.model("Recipe", schema);
};