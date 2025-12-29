// backend/src/models/item.model.js
// ========================================
// ITEM MODEL
// ========================================

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
        required: true,
        trim: true,
        uppercase: true,
      },

      // reference by ItemCategory _id (string/ObjectId both ok)
      itemCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ItemCategory",
        required: false,
      },

      uom: {
        type: String,
        required: true,
        enum: ["Kg", "Ltr", "Nos"],
      },

      brand: {
        type: String,
        trim: true,
      },

      indicativePrice: {
        type: Number,
        min: 0,
      },

      isActive: {
        type: Boolean,
        default: true,
      },
    },
    { timestamps: true }
  );

  mongoose.models.Item || mongoose.model("Item", schema);
};
