// backend/controllers/vendorController.js
const mongoose = require("mongoose");
const Vendor = require("../models/vendorModel");

const isObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * GET /api/vendors
 * Supports query params:
 *   - resort (id or name)
 *   - category
 *   - status
 *   - search  (matches name, code, email, phone)
 *   - limit (number), skip (number)  -> for pagination
 */
exports.getVendors = async (req, res) => {
  try {
    const { resort, category, status, search, limit, skip } = req.query;

    const filter = {};

    // resort filter: allow passing either resort id or resort name (string)
    if (resort) {
      // if it's an ObjectId-like string, match exact string in resorts array
      if (isObjectId(resort)) {
        filter.resorts = resort;
      } else {
        // partial / case-insensitive match on resort name stored as string inside resorts array
        // e.g. resorts: ["Resort A","resort_b"] -> we use regex
        filter.resorts = { $regex: new RegExp(resort.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") };
      }
    }

    if (category) {
      // match vendors where categories array contains the category (case-insensitive)
      filter.categories = { $elemMatch: { $regex: new RegExp(`^${category.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") } };
    }

    if (status) {
      filter.status = status;
    }

    // search across common fields
    if (search) {
      const q = search.trim();
      const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [
        { name: re },
        { code: re },
        { email: re },
        { phone: re },
        { contactPerson: re },
      ];
    }

    // pagination
    const lim = Math.min(Number(limit) || 1000, 5000); // safe cap
    const sk = Number(skip) || 0;

    const query = Vendor.find(filter).sort({ createdAt: -1 }).skip(sk).limit(lim);

    const vendors = await query.exec();

    // Optionally include total count when pagination used
    if (req.query.includeCount === "1") {
      const total = await Vendor.countDocuments(filter);
      return res.json({ total, count: vendors.length, vendors });
    }

    return res.json(vendors);
  } catch (err) {
    console.error("getVendors error", err);
    return res.status(500).json({ message: "Failed to fetch vendors" });
  }
};

/**
 * GET /api/vendors/:idOrCode
 * fetch by ObjectId or by code (case-insensitive)
 */
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

/**
 * POST /api/vendors
 * Normalizes categories/resorts into arrays and uppercases code if provided
 */
exports.createVendor = async (req, res) => {
  try {
    const data = { ...req.body };

    // normalize
    if (data.code) data.code = String(data.code).toUpperCase();
    if (!Array.isArray(data.categories))
      data.categories = data.categories ? [data.categories] : [];
    if (!Array.isArray(data.resorts))
      data.resorts = data.resorts ? [data.resorts] : [];

    // cast certain numeric-like strings
    if (data.creditLimit !== undefined) {
      const n = Number(data.creditLimit);
      if (!Number.isNaN(n)) data.creditLimit = n;
    }
    if (data.minOrderQty !== undefined) {
      const n = Number(data.minOrderQty);
      if (!Number.isNaN(n)) data.minOrderQty = n;
    }

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

/**
 * PUT /api/vendors/:idOrCode
 * Update vendor by id or code
 */
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

    // sanitize numbers
    if (data.creditLimit !== undefined) {
      const n = Number(data.creditLimit);
      if (!Number.isNaN(n)) data.creditLimit = n;
    }
    if (data.minOrderQty !== undefined) {
      const n = Number(data.minOrderQty);
      if (!Number.isNaN(n)) data.minOrderQty = n;
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

/**
 * DELETE /api/vendors/:idOrCode
 */
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
