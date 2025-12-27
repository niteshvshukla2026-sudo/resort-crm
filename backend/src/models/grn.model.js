module.exports = (mongoose) => {
  const schema = new mongoose.Schema({
    grnNo: { type: String, unique: true },
    poId: String,
    requisitionId: String,
    items: Array,
    status: String,
  }, { timestamps: true });

  mongoose.models.GRN || mongoose.model("GRN", schema);
};