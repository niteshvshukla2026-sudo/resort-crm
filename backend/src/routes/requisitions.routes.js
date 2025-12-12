// routes/requisition.routes.js
const express = require("express");
const mongoose = require("mongoose");
const { protect } = require("../middleware/auth");
const requisitionController = require("../controllers/requisition.controller");
const Requisition = require("../models/requisition.model");
const Resort = require("../models/resort.model"); // optional: used if you want to pass resort name -> id

const router = express.Router();

// protect all requisition routes
router.use(protect);

/**
 * GET /api/requisitions
 * Supports optional query filters:
 *  - resort=<resortId>
 *  - status=<status>
 *  - type=<INTERNAL|VENDOR>
 *  - fromDate=YYYY-MM-DD
 *  - toDate=YYYY-MM-DD
 *  - vendor=<vendorId>
 *  - store=<storeId>
 *  - search=<text>  (searches requisitionNo)
 *
 * NOTE: `resort` is expected to be the resort _id the frontend sends.
 * If you need to accept resort *name*, uncomment the Resort lookup below.
 */
router.get("/", async (req, res) => {
  try {
    const { resort, status, type, fromDate, toDate, vendor, store, search } = req.query;

    const filter = {};

    if (resort) {
      // if resort looks like an ObjectId use directly, otherwise try to resolve by name
      if (mongoose.Types.ObjectId.isValid(resort)) {
        filter.resort = resort;
      } else {
        // try to resolve by name (case-insensitive) — optional
        const r = await Resort.findOne({ name: new RegExp(`^${String(resort).trim()}$`, "i") }).lean().exec();
        if (r && r._id) filter.resort = r._id;
        else filter.resort = resort; // fallback: allow whatever was passed
      }
    }

    if (status) filter.status = status;
    if (type) filter.type = type;
    if (vendor) filter.vendor = vendor;
    if (store) filter.store = store;

    if (fromDate || toDate) {
      filter.requiredBy = {};
      if (fromDate) filter.requiredBy.$gte = new Date(fromDate);
      if (toDate) {
        // include whole day for toDate
        const d = new Date(toDate);
        d.setHours(23, 59, 59, 999);
        filter.requiredBy.$lte = d;
      }
    }

    if (search) {
      // simple text search on requisitionNo (you can extend to other fields)
      filter.requisitionNo = { $regex: search, $options: "i" };
    }

    const docs = await Requisition.find(filter)
      .populate("vendor")
      .populate("fromStore")
      .populate("toStore")
      .populate("store")
      .populate("resort")
      .populate("department")
      .populate("lines.item")
      .populate("po")
      .populate("grn")
      .sort({ createdAt: -1 })
      .lean();

    return res.json(docs);
  } catch (err) {
    console.error("requisition list error", err);
    return res.status(500).json({ message: "Failed to list requisitions" });
  }
});

// use controller for other standard endpoints (reuses your controller methods)
router.get("/:id", requisitionController.getOne);
router.post("/", requisitionController.create);
router.put("/:id", requisitionController.update);
router.delete("/:id", requisitionController.delete);

// action endpoints
router.post("/:id/approve", requisitionController.approve);
router.post("/:id/hold", requisitionController.hold);
router.post("/:id/reject", requisitionController.reject);

module.exports = router;
