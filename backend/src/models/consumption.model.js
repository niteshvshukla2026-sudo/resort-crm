module.exports = (mongoose) => {
  const schema = new mongoose.Schema({
    type: String,
    resort: String,
    storeFrom: String,
    lines: Array,
  }, { timestamps: true });

  mongoose.models.Consumption || mongoose.model("Consumption", schema);
};