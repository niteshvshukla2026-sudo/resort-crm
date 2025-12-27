module.exports = (mongoose) => {
  const schema = new mongoose.Schema(
    {
      resort: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Resort",
        required: true,
      },
      store: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Store",
        required: true,
      },
      item: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Item",
        required: true,
      },
      qty: {
        type: Number,
        default: 0,
      },
      updatedAt: {
        type: Date,
        default: Date.now,
      },
    },
    { timestamps: true }
  );

  mongoose.model("StoreStock", schema);
};
