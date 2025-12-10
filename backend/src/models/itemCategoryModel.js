const mongoose = require("mongoose");

const itemCategorySchema = new mongoose.Schema(
  {
    // display name
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // auto-code like IC_367
    code: {
      type: String,
      trim: true,
      unique: true,
    },

    // link to Department
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },

    // optional: link to Resort (copy from department.resort)
    resort: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resort",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ItemCategory", itemCategorySchema);
