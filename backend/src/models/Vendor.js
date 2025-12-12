// backend/models/vendorModel.js
const mongoose = require('mongoose');

const VendorSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  vendorType: String,
  categories: [String],
  // store resorts as ObjectId references to Resort for proper relations & filtering
  resorts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resort',
      index: true,
    },
  ],
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
  status: { type: String, default: 'Active' },
  notes: String
}, { timestamps: true });

// optional index for quick searching by code/name
VendorSchema.index({ code: 1, name: 1 });

module.exports = mongoose.model('Vendor', VendorSchema);
