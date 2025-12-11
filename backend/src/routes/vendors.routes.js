const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csvtojson');
const Vendor = require('../models/Vendor');

const upload = multer({ dest: 'tmp/' });

// GET all vendors
router.get('/', async (req, res) => {
  try {
    const vendors = await Vendor.find().lean();
    res.json(vendors);
  } catch (err) {
    console.error('GET /vendors error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST single vendor (create)
router.post('/', async (req, res) => {
  try {
    // expect body fields
    const payload = req.body;
    // normalize categories/resorts to arrays
    if (payload.categories && typeof payload.categories === 'string') {
      payload.categories = payload.categories.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (payload.resorts && typeof payload.resorts === 'string') {
      payload.resorts = payload.resorts.split(',').map(s => s.trim()).filter(Boolean);
    }
    const vendor = await Vendor.create(payload);
    res.status(201).json(vendor);
  } catch (err) {
    console.error('POST /vendors error', err);
    res.status(400).json({ error: err.message });
  }
});

// POST CSV upload
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const jsonArray = await csv().fromFile(req.file.path);
    // map and normalize each row
    const docs = jsonArray.map(row => {
      // ensure keys match CSV headers exactly (lowercase/trim)
      const categories = (row.categories || row.category || '').toString();
      const resorts = (row.resorts || '').toString();
      return {
        code: row.code || row.Code || row.code?.trim(),
        name: row.name || row.Name,
        vendorType: row.vendorType || row.vendortype,
        categories: categories ? categories.split(',').map(s => s.trim()).filter(Boolean) : [],
        resorts: resorts ? resorts.split(',').map(s => s.trim()).filter(Boolean) : ['ALL'],
        contactPerson: row.contactPerson || '',
        phone: row.phone || '',
        whatsapp: row.whatsapp || row.whatsappNo || '',
        alternatePhone: row.alternatePhone || '',
        email: row.email || '',
        addressLine1: row.addressLine1 || '',
        addressLine2: row.addressLine2 || '',
        city: row.city || '',
        state: row.state || '',
        pincode: row.pincode || '',
        country: row.country || 'India',
        gstNumber: row.gstNumber || '',
        panNumber: row.panNumber || '',
        fssaiNumber: row.fssaiNumber || '',
        paymentTerms: row.paymentTerms || '',
        creditLimit: row.creditLimit ? Number(row.creditLimit) : 0,
        paymentMode: row.paymentMode || '',
        bankName: row.bankName || '',
        accountNumber: row.accountNumber || '',
        ifsc: row.ifsc || '',
        branch: row.branch || '',
        deliveryTime: row.deliveryTime || '',
        minOrderQty: row.minOrderQty ? Number(row.minOrderQty) : 0,
        status: row.status || 'Active',
        notes: row.notes || ''
      };
    });

    // Bulk insert (upsert by code to prevent duplicates)
    const bulkOps = docs.map(d => ({
      updateOne: {
        filter: { code: d.code },
        update: { $set: d },
        upsert: true
      }
    }));

    if (bulkOps.length === 0) return res.status(400).json({ error: 'No rows in CSV' });

    const result = await Vendor.bulkWrite(bulkOps);
    // remove temp file after done (multer stored at req.file.path)
    // fs.unlinkSync(req.file.path) // optional
    res.json({ message: 'Uploaded', result });
  } catch (err) {
    console.error('CSV upload error', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
