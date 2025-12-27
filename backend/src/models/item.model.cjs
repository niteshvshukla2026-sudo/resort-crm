module.exports = function (mongoose) {
  const ItemSchema = new mongoose.Schema(
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

      // reference to ItemCategory (store ObjectId)
      itemCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ItemCategory",
      },

      uom: {
        type: String,
        enum: ["Kg", "Ltr", "Nos"],
        required: true,
      },

      brand: {
        type: String,
        trim: true,
      },

      indicativePrice: {
        type: Number,
        min: 0,
      },
    },
    { timestamps: true }
  );

  return mongoose.models.Item || mongoose.model("Item", ItemSchema);
};
