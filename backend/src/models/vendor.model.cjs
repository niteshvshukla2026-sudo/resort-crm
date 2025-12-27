module.exports = function (mongoose) {
  const VendorSchema = new mongoose.Schema(
    {
      code: {
        type: String,
        required: true,
        trim: true,
        unique: true,
      },

      name: {
        type: String,
        required: true,
        trim: true,
      },

      vendorType: String,

      // categories = array of ItemCategory names / codes
      categories: {
        type: [String],
        default: [],
      },

      // backward compatibility (single)
      category: String,

      // resorts this vendor supplies (store resort ids as string/ObjectId)
      resorts: {
        type: [String],
        default: [],
      },

      resort: String, // backward compatibility

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
      minOrderQty: String,

      status: {
        type: String,
        default: "Active",
      },

      notes: String,
    },
    { timestamps: true }
  );

  return mongoose.models.Vendor || mongoose.model("Vendor", VendorSchema);
};
