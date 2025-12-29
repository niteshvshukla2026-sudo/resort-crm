// backend/src/models/store.model.js
module.exports = (mongoose) => {
  const schema = new mongoose.Schema(
    {
      name: {
        type: String,
        required: true,
        trim: true,
      },

      code: {
        type: String,
        trim: true,
      },

      // 🔗 Resort reference (IMPORTANT)
      resort: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Resort",
        required: true,
      },

      isActive: {
        type: Boolean,
        default: true,
      },
    },
    { timestamps: true }
  );

  // auto-generate store code
  schema.pre("save", function (next) {
    if (!this.code && this.name) {
      this.code =
        this.name
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, "")
          .slice(0, 5) +
        "-" +
        Math.floor(100 + Math.random() * 900);
    }
    next();
  });

  mongoose.models.Store || mongoose.model("Store", schema);
};
