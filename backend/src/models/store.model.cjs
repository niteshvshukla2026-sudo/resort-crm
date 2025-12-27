module.exports = (mongoose) => {
  if (mongoose.models.Store) return;

  const schema = new mongoose.Schema(
    {
      resort: { type: String, required: true },
      name: { type: String, required: true },
      code: { type: String },
    },
    { timestamps: true }
  );

  mongoose.model("Store", schema);
};
