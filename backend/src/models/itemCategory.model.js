// backend/src/models/itemCategory.model.js
// ========================================
// ITEM CATEGORY MODEL
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

      // department reference (string or ObjectId both supported)
      departmentCategory: {
        type: String,
        required: true,
      },

      isActive: {
        type: Boolean,
        default: true,
      },
    },
    { timestamps: true }
  );

  // 🔒 SAFE REGISTER
  mongoose.models.ItemCategory ||
    mongoose.model("ItemCategory", schema);
};
