module.exports = (router, mongoose) => {
  const StoreReplacement = mongoose.models.StoreReplacement;
  const StoreStock = mongoose.models.StoreStock;

  // ==================================================
  // GET ALL STORE REPLACEMENTS (RESORT-WISE)
  // ==================================================
  router.get("/api/store-replacements", async (req, res) => {
    try {
      const { resort } = req.query;
      const filter = resort ? { resort } : {};
      const list = await StoreReplacement.find(filter)
        .sort({ createdAt: -1 })
        .lean();

      res.json(list);
    } catch (err) {
      console.error("GET store-replacements error", err);
      res.status(500).json({ message: "Failed to load store replacements" });
    }
  });

  // ==================================================
  // CREATE STORE REPLACEMENT (STEP 1)
  // ==================================================
  router.post("/api/store-replacements", async (req, res) => {
    try {
      const payload = {
        resort: req.body.resort,
        replNo: req.body.replNo,
        storeId: req.body.storeId,
        date: req.body.date || new Date(),
        status: "OPEN",
        lines: (req.body.lines || []).map((ln) => ({
          itemId: ln.itemId,
          qty: Number(ln.qty),
          issuedQty: 0,
          remark: ln.remark || "",
        })),
      };

      const doc = await StoreReplacement.create(payload);
      res.status(201).json(doc);
    } catch (err) {
      console.error("POST store-replacements error", err);
      res.status(500).json({ message: "Failed to save store replacement" });
    }
  });

  // ==================================================
  // ISSUE TO VENDOR (STEP 2)
  // ==================================================
  router.patch(
    "/api/store-replacements/:id/issue-vendor",
    async (req, res) => {
      try {
        const { id } = req.params;
        const { vendorId, lines } = req.body;

        const doc = await StoreReplacement.findById(id);
        if (!doc)
          return res.status(404).json({ message: "Replacement not found" });

        doc.vendorId = vendorId;
        doc.status = "SENT_TO_VENDOR";

        for (const ln of lines || []) {
          const target = doc.lines.find(
            (l) => String(l._id) === String(ln.lineId)
          );
          if (target) {
            target.issuedQty = Number(ln.issueQty || 0);
            target.remark = ln.remark || target.remark;
          }
        }

        await doc.save();
        res.json(doc);
      } catch (err) {
        console.error("PATCH issue-vendor error", err);
        res.status(500).json({ message: "Failed to issue to vendor" });
      }
    }
  );

  // ==================================================
  // CREATE REPLACEMENT GRN (STEP 3)
  // ==================================================
  router.post(
    "/api/store-replacements/:id/create-grn",
    async (req, res) => {
      try {
        const { id } = req.params;
        const { storeId, lines } = req.body;

        const doc = await StoreReplacement.findById(id);
        if (!doc)
          return res.status(404).json({ message: "Replacement not found" });

        // ADD STOCK BACK TO STORE
        for (const ln of lines || []) {
          await StoreStock.findOneAndUpdate(
            {
              store: storeId,
              item: ln.itemId,
            },
            {
              $inc: { qty: Number(ln.receivedQty || 0) },
            },
            { upsert: true }
          );
        }

        doc.status = "CLOSED";
        await doc.save();

        res.json(doc);
      } catch (err) {
        console.error("POST create-grn error", err);
        res.status(500).json({ message: "Failed to create replacement GRN" });
      }
    }
  );
};
