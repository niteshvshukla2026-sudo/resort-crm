module.exports = (mongoose) => {
  const schema = new mongoose.Schema({
    name: String,
    key: { type: String, unique: true },
    description: String,
    type: { type: String, default: "CUSTOM" },
    storeMode: { type: String, default: "MULTI" },
    permissions: [{ module: String, actions: [String] }],
  }, { timestamps: true });

  mongoose.models.Role || mongoose.model("Role", schema);
};