module.exports = (mongoose) => {
  const schema = new mongoose.Schema({
    code: { type: String, unique: true },
    name: String,
    categories: [String],
    resorts: [String],
    status: String,
  }, { timestamps: true });

  mongoose.models.Vendor || mongoose.model("Vendor", schema);
};