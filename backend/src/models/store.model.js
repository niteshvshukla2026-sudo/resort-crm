module.exports = (mongoose) => {
  const schema = new mongoose.Schema({
    resort: String,
    name: String,
    code: String,
  }, { timestamps: true });

  mongoose.models.Store || mongoose.model("Store", schema);
};