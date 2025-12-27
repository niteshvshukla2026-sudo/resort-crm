module.exports = (mongoose) => {
  // prevent overwrite on hot-reload / multiple requires
  if (mongoose.models.Department) return;

  const departmentSchema = new mongoose.Schema(
    {
      name: {
        type: String,
        required: true,
        trim: true,
      },

      code: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        uppercase: true,
      },
    },
    { timestamps: true }
  );

  mongoose.model("Department", departmentSchema);
};
