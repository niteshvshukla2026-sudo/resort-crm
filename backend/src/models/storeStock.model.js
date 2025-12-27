module.exports = (mongoose) => {
  const schema = new mongoose.Schema({
    resort: String,
    store: String,
    item: String,
    qty: { type: Number, default: 0 },
  }, { timestamps: true });

  schema.index({ store: 1, item: 1 }, { unique: true });
  mongoose.models.StoreStock || mongoose.model("StoreStock", schema);
};