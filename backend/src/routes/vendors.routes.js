// backend/routes/vendorRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const csv = require("csvtojson");
const Vendor = require("../models/vendorModel");
const mongoose = require("mongoose");

const upload = multer({ dest: "tmp/" });

/**
 * GET /api/vendors
 * Supports:
 *  - resort=<resortNameOrId>
 *  - search=<text>
 *  - status=<Active/Inactive>
 *  - type=<vendorType>
 */
router.get("/", async (req, res) => {
  try {
    const { resort, search, status, type } = req.query;

    const filter = {};

    // RESORT FILTER — Stored as plain string array
    if (resort) {
      filter.resorts = { $in: [resort, "ALL"] }; // vendor supports ALL or specific resort
    }

    // STATUS FILTER
    if (status) {
      filter.status = status;
    }

    // VENDOR TYPE FILTER
    if (type) {
      filter.vendorType = type;
    }

    // SEARCH (name, code, phone, gst)
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { gstNumber: { $regex: search, $options: "i" } },
      ];
    }

    const vendors = await Vendor.find(filter).sort({ createdAt: -1 }).lean();
    res.json(vendors);
  } catch (err) {
    console.error("GET /vendors error", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * POST /api/vendors — Create vendor
 */
router.post("/", async (req, res) => {
  try {
    const payload = { ...req.body };

    // Normalization
    if (payload.code) payload.code = String(payload.code).toUpperCase();
    if (typeof payload.categories === "string") {
      payload.categories = payload.categories
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    if (typeof payload.resorts === "string") {
      payload.resorts = payload.resorts
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    if (!Array.isArray(payload.resorts)) payload.resorts = [];

    const vendor = await Vendor.create(payload);
    res.status(201).json(vendor);
  } catch (err) {
    console.error("POST /vendors error", err);
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST CSV Upload
 */
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ error: "No file uploaded" });

    const jsonArray = await csv().fromFile(req.file.path);

    const docs = jsonArray.map((row) => {
      const categories = (row.categories || row.category || "").toString();
      const resorts = (row.resorts || row.resort || "").toString();

      return {
        code: (row.code || row.Code || "").trim().toUpperCase(),
        name: row.name || row.Name || "",
        vendorType: row.vendorType || row.vendortype || "",
        categories: categories
          ? categories.split(",").map((s) => s.trim())
          : [],
        resorts: resorts
          ? resorts.split(",").map((s) => s.trim())
          : ["ALL"],

        contactPerson: row.contactPerson || "",
        phone: row.phone || "",
        whatsapp: row.whatsapp || row.whatsappNo || "",
        alternatePhone: row.alternatePhone || "",
        email: row.email || "",

        addressLine1: row.addressLine1 || "",
        addressLine2: row.addressLine2 || "",
        city: row.city || "",
        state: row.state || "",
        pincode: row.pincode || "",
        country: row.country || "India",

        gstNumber: row.gstNumber || "",
        panNumber: row.panNumber || "",
        fssaiNumber: row.fssaiNumber || "",

        paymentTerms: row.paymentTerms || "",
        creditLimit: row.creditLimit ? Number(row.creditLimit) : 0,
        paymentMode: row.paymentMode || "",
        bankName: row.bankName || "",
        accountNumber: row.accountNumber || "",
        ifsc: row.ifsc || "",
        branch: row.branch || "",
        deliveryTime: row.deliveryTime || "",
        minOrderQty: row.minOrderQty ? Number(row.minOrderQty) : 0,

        status: row.status || "Active",
        notes: row.notes || "",
      };
    });

    const bulkOps = docs.map((d) => ({
      updateOne: {
        filter: { code: d.code },
        update: { $set: d },
        upsert: true,
      },
    }));

    if (!bulkOps.length)
      return res.status(400).json({ error: "CSV file empty" });

    const result = await Vendor.bulkWrite(bulkOps);

    res.json({
      message: "Vendors uploaded/updated successfully",
      inserted: result.upsertedCount,
      updated: result.modifiedCount,
    });
  } catch (err) {
    console.error("CSV upload error", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
