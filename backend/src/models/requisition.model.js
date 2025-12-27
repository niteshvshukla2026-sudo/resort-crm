module.exports = (mongoose) => {
  const schema = new mongoose.Schema({
    requisitionNo: { type: String, unique: true },
    type: String,
    resort: { type: mongoose.Schema.Types.ObjectId, ref: "Resort" },
    status: String,
    lines: Array,
  }, { timestamps: true });

  mongoose.models.Requisition || mongoose.model("Requisition", schema);
};