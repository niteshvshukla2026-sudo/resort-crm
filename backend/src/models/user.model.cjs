module.exports = (mongoose) => {
  if (mongoose.models.User) return;

  const userSchema = new mongoose.Schema(
    {
      name: { type: String, required: true },
      email: { type: String, required: true, unique: true },
      password: { type: String, required: true },
      role: { type: String, required: true },

      resorts: [
        { type: mongoose.Schema.Types.ObjectId, ref: "Resort" }
      ],

      stores: [
        { type: mongoose.Schema.Types.ObjectId, ref: "Store" }
      ],

      defaultResort: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Resort",
      },

      status: {
        type: String,
        enum: ["ACTIVE", "INACTIVE"],
        default: "ACTIVE",
      },
    },
    { timestamps: true }
  );

  userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await require("bcryptjs").hash(this.password, 10);
    next();
  });

  userSchema.methods.matchPassword = function (entered) {
    return require("bcryptjs").compare(entered, this.password);
  };

  mongoose.model("User", userSchema);
};
