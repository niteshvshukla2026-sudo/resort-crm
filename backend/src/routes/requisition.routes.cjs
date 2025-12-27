module.exports = (router, mongoose) => {
  const Requisition = mongoose.models.Requisition;
  const PO = mongoose.models.PO;
  const GRN = mongoose.models.GRN;
  const StoreStock = mongoose.models.StoreStock;

  // ==================================================
  // GET ALL REQUISITIONS (RESORT-WISE)
  // ==================================================
  router.get("/api/requisitions", async (req, res) => {
    try {
      const { resort } = req.query;

      const filter = {};
      if (resort && resort !== "ALL") {
        filter.resort = resort;
      }

      const list = await Requisition.find(filter)
        .sort({ createdAt: -1 })
        .lean();

      res.json(list);
    } catch (err) {
      console.error("GET /requisitions error", err);
      res.status(500).json({ message: "Failed to load requisitions" });
    }
  });

  // ==================================================
  // CREATE REQUISITION
  // ==================================================
  router.post("/api/requisitions", async (req, res) => {
    try {
      const payload = {
        type: req.body.type,
        resort: req.body.resort,
        department: req.body.department,
        fromStore: req.body.fromStore,
        toStore: req.body.toStore,
        store: req.body.store,
        vendor: req.body.vendor,
        requiredBy: req.body.requiredBy,
        status: "PENDING",
        lines: (req.body.lines || []).map((ln) => ({
          lineId: ln.lineId,
          itemCategory: ln.itemCategory,
          item: ln.item,
          qty: Number(ln.qty),
          remark: ln.remark || "",
        })),
      };

      const doc = await Requisition.create(payload);
      res.status(201).json(doc);
    } catch (err) {
      console.error("POST /requisitions error", err);
      res.status(500).json({ message: "Failed to create requisition" });
    }
  });

  // ==================================================
  // UPDATE REQUISITION
  // ==================================================
  router.put("/api/requisitions/:id", async (req, res) => {
    try {
      const { id } = req.params;

      const doc = await Requisition.findById(id);
      if (!doc) return res.status(404).json({ message: "Requisition not found" });

      doc.type = req.body.type;
      doc.resort = req.body.resort;
      doc.department = req.body.department;
      doc.fromStore = req.body.fromStore;
      doc.toStore = req.body.toStore;
      doc.store = req.body.store;
      doc.vendor = req.body.vendor;
      doc.requiredBy = req.body.requiredBy;

      doc.lines = (req.body.lines || []).map((ln) => ({
        lineId: ln.lineId,
        itemCategory: ln.itemCategory,
        item: ln.item,
        qty: Number(ln.qty),
        remark: ln.remark || "",
      }));

      await doc.save();
      res.json(doc);
    } catch (err) {
      console.error("PUT /requisitions error", err);
      res.status(500).json({ message: "Failed to update requisition" });
    }
  });

  // ==================================================
  // DELETE REQUISITION
  // ==================================================
  router.delete("/api/requisitions/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await Requisition.findByIdAndDelete(id);
      res.json({ ok: true });
    } catch (err) {
      console.error("DELETE /requisitions error", err);
      res.status(500).json({ message: "Failed to delete requisition" });
    }
  });

  // ==================================================
  // APPROVE / HOLD / REJECT
  // ==================================================
  router.post("/api/requisitions/:id/approve", async (req, res) => {
    try {
      const doc = await Requisition.findByIdAndUpdate(
        req.params.id,
        { status: "APPROVED" },
        { new: true }
      );
      res.json(doc);
    } catch (err) {
      res.status(500).json({ message: "Failed to approve requisition" });
    }
  });

  router.post("/api/requisitions/:id/hold", async (req, res) => {
    try {
      const doc = await Requisition.findByIdAndUpdate(
        req.params.id,
        { status: "ON_HOLD" },
        { new: true }
      );
      res.json(doc);
    } catch (err) {
      res.status(500).json({ message: "Failed to hold requisition" });
    }
  });

  router.post("/api/requisitions/:id/reject", async (req, res) => {
    try {
      const doc = await Requisition.findByIdAndUpdate(
        req.params.id,
        { status: "REJECTED", rejectReason: req.body.reason },
        { new: true }
      );
      res.json(doc);
    } catch (err) {
      res.status(500).json({ message: "Failed to reject requisition" });
    }
  });

  // ==================================================
  // CREATE PO FROM REQUISITION
  // ==================================================
  router.post("/api/requisitions/:id/create-po", async (req, res) => {
    try {
      const reqDoc = await Requisition.findById(req.params.id);
      if (!reqDoc) return res.status(404).json({ message: "Requisition not found" });

      const po = await PO.create({
        poNo: req.body.poNo,
        vendor: req.body.vendor,
        resort: req.body.resort,
        deliverTo: req.body.deliverTo,
        poDate: req.body.poDate,
        items: req.body.items,
        subTotal: req.body.subTotal,
        taxPercent: req.body.taxPercent,
        taxAmount: req.body.taxAmount,
        total: req.body.total,
      });

      reqDoc.status = "PO_CREATED";
      reqDoc.po = { _id: po._id, code: po.poNo };
      await reqDoc.save();

      res.json({ requisition: reqDoc, po });
    } catch (err) {
      console.error("create-po error", err);
      res.status(500).json({ message: "Failed to create PO" });
    }
  });

  // ==================================================
  // CREATE GRN FROM REQUISITION
  // ==================================================
  router.post("/api/requisitions/:id/create-grn", async (req, res) => {
    try {
      const reqDoc = await Requisition.findById(req.params.id);
      if (!reqDoc) return res.status(404).json({ message: "Requisition not found" });

      const grn = await GRN.create({
        grnNo: req.body.grnNo,
        requisition: reqDoc._id,
        store: req.body.store,
        receivedBy: req.body.receivedBy,
        receivedDate: req.body.receivedDate,
        challanNo: req.body.challanNo,
        billNo: req.body.billNo,
        items: req.body.items,
      });

      // ADD STOCK
      for (const it of req.body.items || []) {
        await StoreStock.findOneAndUpdate(
          { store: req.body.store, item: it.item },
          { $inc: { qty: Number(it.qtyReceived || 0) } },
          { upsert: true }
        );
      }

      reqDoc.status = "GRN_CREATED";
      reqDoc.grn = { _id: grn._id, code: grn.grnNo };
      await reqDoc.save();

      res.json({ requisition: reqDoc, grn });
    } catch (err) {
      console.error("create-grn error", err);
      res.status(500).json({ message: "Failed to create GRN" });
    }
  });
};
