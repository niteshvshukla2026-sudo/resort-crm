const express = require("express");
const router = express.Router();
const multer = require("multer");
const csv = require("csvtojson");
const Vendor = require("../models/Vendor");

const upload = multer({ dest: "tmp/" });

/**
 * ================================
 * GET /api/vendors
 * Optional query:
 *   ?resort=RESORT_ID
 * ================================
 */
router.get("/", async (req, res) => {
  try {
    const { resort } = req.query;

    const query = {};

    // 🔥 RESORT WISE FILTER
    if (resort && resort !== "ALL") {
      query.resorts = resort; // matches array field
    }

    const vendors = await Vendor.find(query).lean();
    res.json(vendors);
  } catch (err) {
    console.error("GET /vendors error", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * ================================
 * POST /api/vendors (CREATE)
 * ================================
 */
router.post("/", async (req, res) => {
  try {
    const payload = { ...req.body };

    // normalize categories
    if (payload.categories && typeof payload.categories === "string") {
      payload.categories = payload.categories
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    // normalize resorts
    if (payload.resorts && typeof payload.resorts === "string") {
      payload.resorts = payload.resorts
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    const vendor = await Vendor.create(payload);
    res.status(201).json(vendor);
  } catch (err) {
    console.error("POST /vendors error", err);
    res.status(400).json({ error: err.message });
  }
});

/**
 * ================================
 * POST /api/vendors/upload (CSV)
 * ================================
 */
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const jsonArray = await csv().fromFile(req.file.path);

    if (!jsonArray.length) {
      return res.status(400).json({ error: "Empty CSV file" });
    }

    const docs = jsonArray.map((row) => {
      const categoriesRaw = row.categories || row.category || "";
      const resortsRaw = row.resorts || row.resort || "";

      return {
        code: String(row.code || row.Code || "").trim(),
        name: row.name || row.Name || "",
        vendorType: row.vendorType || row.vendortype || "",

        categories: categoriesRaw
          ? categoriesRaw
              .split(/[,;]+/)
              .map((s) => s.trim())
              .filter(Boolean)
          : [],

        resorts: resortsRaw
          ? resortsRaw
              .split(/[,;]+/)
              .map((s) => s.trim())
              .filter(Boolean)
          : [],

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

    const bulkOps = docs.map((doc) => ({
      updateOne: {
        filter: { code: doc.code },
        update: { $set: doc },
        upsert: true,
      },
    }));

    const result = await Vendor.bulkWrite(bulkOps);

    res.json({
      message: "CSV uploaded successfully",
      inserted: result.upsertedCount,
      updated: result.modifiedCount,
    });
  } catch (err) {
    console.error("CSV upload error", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
