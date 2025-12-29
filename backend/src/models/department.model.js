module.exports = (mongoose) => {
  const schema = new mongoose.Schema(
    {
      name: { type: String, required: true },
      code: { type: String, required: true },
    },
    { timestamps: true }
  );

  mongoose.models.Department ||
    mongoose.model("Department", schema);
};
