// routes/po.routes.js
const express = require("express");
const router = express.Router();
const poCtrl = require("../controllers/po.controller");

// ------------------------------------------
// LIST POs with resort filtering
// GET /api/po?resort=<id>&vendor=<id>&status=CREATED&from=2025-01-01&to=2025-01-20
// ------------------------------------------
router.get("/", async (req, res, next) => {
  try {
    req.filter = {}; // pass filter object into controller

    const { resort, vendor, status, deliverTo, from, to, search } = req.query;

    if (resort) req.filter.resort = resort;
    if (vendor) req.filter.vendor = vendor;
    if (status) req.filter.status = status;
    if (deliverTo) req.filter.deliverTo = deliverTo;

    // DATE RANGE
    if (from || to) {
      req.filter.poDate = {};
      if (from) req.filter.poDate.$gte = new Date(from);
      if (to) {
        const dt = new Date(to);
        dt.setHours(23, 59, 59, 999);
        req.filter.poDate.$lte = dt;
      }
    }

    // TEXT SEARCH (PO No)
    if (search) {
      req.filter.poNo = { $regex: search, $options: "i" };
    }

    return poCtrl.list(req, res, next);
  } catch (err) {
    console.error("PO route filter error", err);
    return res.status(500).json({ message: "Failed to apply filters" });
  }
});

// ------------------------------------------
router.get("/:id", poCtrl.getOne);
router.post("/", poCtrl.create);
router.put("/:id", poCtrl.update);
router.delete("/:id", poCtrl.delete);

module.exports = router;
