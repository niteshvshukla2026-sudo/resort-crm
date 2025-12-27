module.exports = (mongoose) => {
  const schema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    role: String,
    resorts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Resort" }],
    stores: [{ type: mongoose.Schema.Types.ObjectId, ref: "Store" }],
    defaultResort: { type: mongoose.Schema.Types.ObjectId, ref: "Resort" },
    status: { type: String, default: "ACTIVE" },
  }, { timestamps: true });

  schema.pre("save", async function(next){
    if (!this.isModified("password")) return next();
    this.password = await require("bcryptjs").hash(this.password, 10);
    next();
  });

  mongoose.models.User || mongoose.model("User", schema);
};