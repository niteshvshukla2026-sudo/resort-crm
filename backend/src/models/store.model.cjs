module.exports = function (mongoose) {
  const StoreSchema = new mongoose.Schema(
    {
      name: {
        type: String,
        required: true,
        trim: true,
      },

      code: {
        type: String,
        required: true,
        trim: true,
        unique: true,
      },

      // Resort reference (store ObjectId as string)
      resort: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Resort",
        required: true,
      },
    },
    { timestamps: true }
  );

  return mongoose.models.Store || mongoose.model("Store", StoreSchema);
};
