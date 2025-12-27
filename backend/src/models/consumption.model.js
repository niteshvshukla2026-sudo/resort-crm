module.exports = (mongoose) => {
  const Schema = mongoose.Schema;

  const lineSchema = new Schema(
    {
      item: { type: String },
      recipe: { type: String },
      qty: { type: Number, required: true },
      category: String,
      uom: String,
      remarks: String,
    },
    { _id: false }
  );

  const consumptionSchema = new Schema(
    {
      date: { type: Date, default: Date.now },

      type: {
        type: String,
        enum: ["LUMPSUM", "RECIPE_LUMPSUM", "RECIPE_PORTION"],
        required: true,
      },

      resort: { type: String, required: true },   // 🔥 matches frontend
      storeFrom: { type: String, required: true },

      notes: String,

      lines: { type: [lineSchema], default: [] },

      createdBy: String,
    },
    { timestamps: true }
  );

  return (
    mongoose.models.Consumption ||
    mongoose.model("Consumption", consumptionSchema)
  );
};
