module.exports = function (mongoose) {
  const PermissionSchema = new mongoose.Schema(
    {
      module: { type: String, required: true }, // USERS, ROLES, ITEMS etc
      actions: [{ type: String }], // CREATE, READ, UPDATE, DELETE, APPROVE
    },
    { _id: false }
  );

  const RoleSchema = new mongoose.Schema(
    {
      name: { type: String, required: true },
      key: { type: String, required: true, unique: true }, // SUPER_ADMIN
      description: { type: String },

      // SYSTEM / CUSTOM
      type: {
        type: String,
        enum: ["SYSTEM", "CUSTOM"],
        default: "CUSTOM",
      },

      // SINGLE / MULTI (used by UserCreate.jsx)
      storeMode: {
        type: String,
        enum: ["SINGLE", "MULTI"],
        default: "MULTI",
      },

      permissions: {
        type: [PermissionSchema],
        default: [],
      },
    },
    { timestamps: true }
  );

  return mongoose.models.Role || mongoose.model("Role", RoleSchema);
};
