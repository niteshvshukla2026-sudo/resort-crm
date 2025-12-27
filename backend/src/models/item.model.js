module.exports = (mongoose) => {
  const schema = new mongoose.Schema({
    name: String,
    code: String,
    itemCategory: String,
    uom: String,
    brand: String,
    indicativePrice: Number,
    stockByStore: { type: Map, of: Number },
  }, { timestamps: true });

  mongoose.models.Item || mongoose.model("Item", schema);
};