// backend/models/vendorModel.js
const mongoose = require("mongoose");

const vendorSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },

    vendorType: {
      type: String,
      enum: ["Company", "Individual", "Distributor", "Manufacturer", ""],
      default: "",
    },

    // multi-select
    categories: [{ type: String, trim: true }],

    // ek single category legacy ke liye (front-end payload.me category bhi bhej sakta hai)
    category: { type: String, trim: true },

    // resorts supplied (store ids or ObjectId of Resort, abhi string rakha for flexibility)
    resorts: [{ type: String, trim: true }],
    resort: { type: String, trim: true }, // legacy single

    contactPerson: { type: String, trim: true },
    phone: { type: String, trim: true },
    whatsapp: { type: String, trim: true },
    alternatePhone: { type: String, trim: true },
    email: { type: String, trim: true },

    addressLine1: { type: String, trim: true },
    addressLine2: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    pincode: { type: String, trim: true },
    country: { type: String, trim: true },

    gstNumber: { type: String, trim: true },
    panNumber: { type: String, trim: true },
    fssaiNumber: { type: String, trim: true },

    paymentTerms: { type: String, trim: true },
    creditLimit: { type: Number }, // front-end number / string bhej sakta hai
    paymentMode: { type: String, trim: true },

    bankName: { type: String, trim: true },
    accountNumber: { type: String, trim: true },
    ifsc: { type: String, trim: true },
    branch: { type: String, trim: true },

    deliveryTime: { type: Number }, // days
    minOrderQty: { type: Number },

    status: {
      type: String,
      enum: ["Active", "Inactive", "Blacklisted"],
      default: "Active",
    },

    notes: { type: String, trim: true },
  },
  {
    timestamps: true,
  }
);

// agar categories diya hai aur category empty hai to auto set
vendorSchema.pre("save", function (next) {
  if (!this.category && Array.isArray(this.categories) && this.categories.length) {
    this.category = this.categories[0];
  }
  if (!this.resort && Array.isArray(this.resorts) && this.resorts.length) {
    this.resort = this.resorts[0];
  }
  next();
});

const Vendor = mongoose.model("Vendor", vendorSchema);

module.exports = Vendor;
