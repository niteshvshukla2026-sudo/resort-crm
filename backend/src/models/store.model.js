module.exports = (mongoose) => {
  if (mongoose.models.Store) return mongoose.models.Store;

  const StoreSchema = new mongoose.Schema(
    {
      name: { type: String, required: true },
      code: { type: String },
      resort: { type: mongoose.Schema.Types.ObjectId, ref: "Resort" },
      isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
  );

  return mongoose.model("Store", StoreSchema);
};
