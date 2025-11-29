import mongoose from "mongoose";

const storeSchema = new mongoose.Schema(
  {
    resort: { type: mongoose.Schema.Types.ObjectId, ref: "Resort", required: true },
    name: { type: String, required: true },
    code: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Store = mongoose.model("Store", storeSchema);
export default Store;
