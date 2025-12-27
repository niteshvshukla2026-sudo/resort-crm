module.exports = function (mongoose) {
  const DepartmentSchema = new mongoose.Schema(
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
      },
    },
    {
      timestamps: true,
    }
  );

  return (
    mongoose.models.Department ||
    mongoose.model("Department", DepartmentSchema)
  );
};
