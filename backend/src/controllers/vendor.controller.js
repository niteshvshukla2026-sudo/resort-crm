// backend/controllers/vendorController.js
const mongoose = require("mongoose");
const Vendor = require("../models/vendorModel");

const isObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// GET /api/vendors  -> array
exports.getVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find().sort({ createdAt: -1 });
    return res.json(vendors);
  } catch (err) {
    console.error("getVendors error", err);
    return res.status(500).json({ message: "Failed to fetch vendors" });
  }
};

// GET /api/vendors/:idOrCode
exports.getVendorByIdOrCode = async (req, res) => {
  const { id } = req.params;
  try {
    let vendor;
    if (isObjectId(id)) {
      vendor = await Vendor.findById(id);
    } else {
      vendor = await Vendor.findOne({ code: id.toUpperCase() });
    }

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    return res.json(vendor);
  } catch (err) {
    console.error("getVendorByIdOrCode error", err);
    return res.status(500).json({ message: "Failed to fetch vendor" });
  }
};

// POST /api/vendors
exports.createVendor = async (req, res) => {
  try {
    const data = { ...req.body };

    // normalize fields like frontend
    if (data.code) data.code = String(data.code).toUpperCase();
    if (!Array.isArray(data.categories)) data.categories = data.categories ? [data.categories] : [];
    if (!Array.isArray(data.resorts)) data.resorts = data.resorts ? [data.resorts] : [];

    const vendor = await Vendor.create(data);
    return res.status(201).json(vendor);
  } catch (err) {
    console.error("createVendor error", err);
    if (err.code === 11000 && err.keyPattern && err.keyPattern.code) {
      return res.status(400).json({ message: "Vendor code already exists" });
    }
    return res.status(500).json({ message: "Failed to create vendor" });
  }
};

// PUT /api/vendors/:idOrCode
exports.updateVendor = async (req, res) => {
  const { id } = req.params;
  try {
    const data = { ...req.body };

    if (data.code) data.code = String(data.code).toUpperCase();
    if (data.categories && !Array.isArray(data.categories)) {
      data.categories = [data.categories];
    }
    if (data.resorts && !Array.isArray(data.resorts)) {
      data.resorts = [data.resorts];
    }

    let query;
    if (isObjectId(id)) {
      query = { _id: id };
    } else {
      query = { code: id.toUpperCase() };
    }

    const vendor = await Vendor.findOneAndUpdate(query, data, {
      new: true,
      runValidators: true,
    });

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    return res.json(vendor);
  } catch (err) {
    console.error("updateVendor error", err);
    if (err.code === 11000 && err.keyPattern && err.keyPattern.code) {
      return res.status(400).json({ message: "Vendor code already exists" });
    }
    return res.status(500).json({ message: "Failed to update vendor" });
  }
};

// DELETE /api/vendors/:idOrCode
exports.deleteVendor = async (req, res) => {
  const { id } = req.params;
  try {
    let query;
    if (isObjectId(id)) {
      query = { _id: id };
    } else {
      query = { code: id.toUpperCase() };
    }

    const vendor = await Vendor.findOneAndDelete(query);
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    return res.json({ message: "Vendor deleted", id: vendor._id, code: vendor.code });
  } catch (err) {
    console.error("deleteVendor error", err);
    return res.status(500).json({ message: "Failed to delete vendor" });
  }
};
