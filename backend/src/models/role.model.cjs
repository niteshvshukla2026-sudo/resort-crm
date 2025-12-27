module.exports = (mongoose) => {
  if (mongoose.models.Role) return;

  const permissionSchema = new mongoose.Schema(
    {
      module: String,
      actions: [String],
    },
    { _id: false }
  );

  const roleSchema = new mongoose.Schema(
    {
      name: { type: String, required: true },
      key: { type: String, required: true, unique: true },
      description: String,
      type: { type: String, enum: ["SYSTEM", "CUSTOM"], default: "CUSTOM" },
      storeMode: { type: String, enum: ["SINGLE", "MULTI"], default: "MULTI" },
      permissions: [permissionSchema],
    },
    { timestamps: true }
  );

  mongoose.model("Role", roleSchema);
};
