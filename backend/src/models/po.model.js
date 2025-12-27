module.exports = (mongoose) => {
  const schema = new mongoose.Schema({
    poNo: { type: String, unique: true },
    requisitionId: String,
    vendor: String,
    items: Array,
    status: String,
  }, { timestamps: true });

  mongoose.models.PO || mongoose.model("PO", schema);
};