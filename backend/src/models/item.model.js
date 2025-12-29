module.exports = (mongoose) => {
  const schema = new mongoose.Schema(
    {
      name: { type: String, required: true },
      code: { type: String, required: true },

      // 🔥 store only category id (string / ObjectId both allowed by frontend)
      itemCategory: { type: mongoose.Schema.Types.Mixed },

      uom: { type: String, required: true }, // Kg / Ltr / Nos
      brand: { type: String },
      indicativePrice: { type: Number },
    },
    { timestamps: true }
  );

  mongoose.models.Item || mongoose.model("Item", schema);
};
