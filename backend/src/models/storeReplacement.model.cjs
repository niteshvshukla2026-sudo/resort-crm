module.exports = (mongoose) => {
  const Schema = mongoose.Schema;

  const lineSchema = new Schema(
    {
      lineId: String,
      itemId: { type: String, required: true },
      qty: { type: Number, required: true },        // replacement qty
      issuedQty: { type: Number, default: 0 },      // issued to vendor
      receivedQty: { type: Number, default: 0 },    // received back
      remark: String,
    },
    { _id: false }
  );

  const schema = new Schema(
    {
      replNo: { type: String, required: true, unique: true },

      resort: { type: String, required: true },
      storeId: { type: String, required: true },

      vendorId: String,

      date: { type: Date, default: Date.now },

      status: {
        type: String,
        enum: ["OPEN", "SENT_TO_VENDOR", "CLOSED"],
        default: "OPEN",
      },

      lines: { type: [lineSchema], default: [] },

      createdBy: String,
    },
    { timestamps: true }
  );

  return (
    mongoose.models.StoreReplacement ||
    mongoose.model("StoreReplacement", schema)
  );
};
