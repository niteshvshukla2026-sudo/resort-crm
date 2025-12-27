module.exports = (mongoose) => {
  const schema = new mongoose.Schema({
    replNo: String,
    resort: String,
    storeId: String,
    vendorId: String,
    status: String,
    lines: Array,
  }, { timestamps: true });

  mongoose.models.StoreReplacement || mongoose.model("StoreReplacement", schema);
};