module.exports = (mongoose) => {
  const schema = new mongoose.Schema(
    {
      name: { type: String, required: true },

      // auto-generated / stored earlier in router
      code: { type: String },

      // 🔥 resort id / code / name (as already used)
      resort: { type: String, required: true },
    },
    { timestamps: true }
  );

  mongoose.models.Store || mongoose.model("Store", schema);
};
