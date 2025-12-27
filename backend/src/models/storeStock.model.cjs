module.exports = (mongoose) => {
  if (mongoose.models.StoreStock) return;

  const schema = new mongoose.Schema(
    {
      resort: { type: String, required: true },
      store: { type: String, required: true },
      item: { type: String, required: true },
      qty: { type: Number, default: 0 },
    },
    { timestamps: true }
  );

  schema.index({ store: 1, item: 1 }, { unique: true });

  mongoose.model("StoreStock", schema);
};
