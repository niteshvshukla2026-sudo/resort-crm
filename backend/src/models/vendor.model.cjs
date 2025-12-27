module.exports = (mongoose) => {
  if (mongoose.models.Vendor) return;

  const schema = new mongoose.Schema(
    {
      code: { type: String, unique: true },
      name: String,
      vendorType: String,
      categories: [String],
      resorts: [String],
      contactPerson: String,
      phone: String,
      whatsapp: String,
      alternatePhone: String,
      email: String,
      addressLine1: String,
      addressLine2: String,
      city: String,
      state: String,
      pincode: String,
      country: String,
      gstNumber: String,
      panNumber: String,
      fssaiNumber: String,
      paymentTerms: String,
      creditLimit: Number,
      paymentMode: String,
      bankName: String,
      accountNumber: String,
      ifsc: String,
      branch: String,
      deliveryTime: String,
      minOrderQty: Number,
      status: String,
      notes: String,
    },
    { timestamps: true }
  );

  mongoose.model("Vendor", schema);
};
