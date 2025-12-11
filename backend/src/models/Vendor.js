const mongoose = require('mongoose');

const VendorSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  vendorType: String,
  categories: [String],
  resorts: [String], // store as array
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

module.exports = mongoose.model('Vendor', VendorSchema);
