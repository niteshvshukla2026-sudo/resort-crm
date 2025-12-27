const bcrypt = require("bcryptjs");

module.exports = function (mongoose) {
  const UserSchema = new mongoose.Schema(
    {
      name: { type: String, required: true, trim: true },

      email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
      },

      password: { type: String, required: true },

      // role.key (eg: SUPER_ADMIN, STORE_USER)
      role: { type: String, required: true },

      // multi resort support (future)
      resorts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Resort" }],

      defaultResort: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Resort",
      },

      // allowed stores
      stores: [{ type: mongoose.Schema.Types.ObjectId, ref: "Store" }],

      status: {
        type: String,
        enum: ["ACTIVE", "INACTIVE"],
        default: "ACTIVE",
      },
    },
    { timestamps: true }
  );

  // 🔐 password hash
  UserSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
  });

  return mongoose.models.User || mongoose.model("User", UserSchema);
};
