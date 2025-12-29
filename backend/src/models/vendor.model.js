module.exports = (mongoose) => {
  const schema = new mongoose.Schema(
    {
      code: { type: String, index: true },
      name: { type: String, required: true },

      vendorType: { type: String },

      // 🔥 multi or single both supported
      categories: [{ type: String }],
      category: { type: String },

      resorts: [{ type: String }],
      resort: { type: String },

      contactPerson: { type: String },
      phone: { type: String },
      whatsapp: { type: String },
      alternatePhone: { type: String },
      email: { type: String },

      addressLine1: { type: String },
      addressLine2: { type: String },
      city: { type: String },
      state: { type: String },
      pincode: { type: String },
      country: { type: String },

      gstNumber: { type: String },
      panNumber: { type: String },
      fssaiNumber: { type: String },

      paymentTerms: { type: String },
      creditLimit: { type: Number },
      paymentMode: { type: String },

      bankName: { type: String },
      accountNumber: { type: String },
      ifsc: { type: String },
      branch: { type: String },

      deliveryTime: { type: Number },
      minOrderQty: { type: Number },

      status: { type: String, default: "Active" },
      notes: { type: String },
    },
    { timestamps: true }
  );

  mongoose.models.Vendor || mongoose.model("Vendor", schema);
};
