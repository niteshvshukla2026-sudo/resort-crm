// routes/grn.routes.js
const express = require("express");
const router = express.Router();
const grnCtrl = require("../controllers/grn.controller");

/**
 * GET /api/grn
 * Supports filters:
 *  - resort=<resortId>
 *  - store=<storeId>
 *  - vendor=<vendorId>
 *  - po=<poId>
 *  - from=<YYYY-MM-DD>
 *  - to=<YYYY-MM-DD>
 *  - search=<text> (GRN No)
 *
 * Route middleware builds req.filter and passes to controller
 */
router.get("/", async (req, res, next) => {
  try {
    const { resort, store, vendor, po, from, to, search } = req.query;

    req.filter = {}; // filter passed to controller

    if (resort) req.filter.resort = resort; // requires GRN model has resort field
    if (store) req.filter.store = store;
    if (vendor) req.filter.vendor = vendor; // if vendor is stored on GRN through PO
    if (po) req.filter.po = po;

    // DATE RANGE
    if (from || to) {
      req.filter.receivedDate = {};
      if (from) req.filter.receivedDate.$gte = new Date(from);
      if (to) {
        const d = new Date(to);
        d.setHours(23, 59, 59, 999);
        req.filter.receivedDate.$lte = d;
      }
    }

    // TEXT SEARCH
    if (search) {
      req.filter.grnNo = { $regex: search, $options: "i" };
    }

    return grnCtrl.list(req, res, next);
  } catch (err) {
    console.error("GRN filter error", err);
    return res.status(500).json({ message: "Failed to apply GRN filters" });
  }
});

// normal CRUD
router.get("/:id", grnCtrl.getOne);
router.post("/", grnCtrl.create);
router.put("/:id", grnCtrl.update);
router.delete("/:id", grnCtrl.delete);

module.exports = router;
