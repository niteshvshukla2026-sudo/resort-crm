const express = require("express");
const permit = require("../middlewares/permit.cjs");

module.exports = function grnRoutes(router, { GRN, PO, Requisition, StoreStock }) {

  // LIST
  router.get(
    "/api/grn",
    permit("GRN", "READ"),
    async (req, res) => {
      const data = await GRN.find().lean();
      res.json(data);
    }
  );

  // CREATE GRN
  router.post(
    "/api/po/:id/create-grn",
    permit("GRN", "CREATE"),
    async (req, res) => {
      const po = await PO.findById(req.params.id);
      if (!po) return res.status(404).json({ message: "PO not found" });

      const grn = await GRN.create({
        poId: po._id,
        requisitionId: po.requisitionId,
        vendor: po.vendor,
        resort: po.resort,
        store: po.deliverTo,
        items: req.body.items,
      });

      res.status(201).json(grn);
    }
  );

  // CLOSE GRN (STOCK ENTRY)
  router.post(
    "/api/grn/:id/close",
    permit("GRN", "APPROVE"),
    async (req, res) => {
      const grn = await GRN.findById(req.params.id);
      if (!grn || grn.status === "CLOSED") {
        return res.status(400).json({ message: "Invalid GRN" });
      }

      for (const line of grn.items) {
        await StoreStock.findOneAndUpdate(
          { store: grn.store, item: line.item },
          { $inc: { qty: line.receivedQty } },
          { upsert: true }
        );
      }

      grn.status = "CLOSED";
      await grn.save();

      res.json({ message: "GRN closed & stock updated" });
    }
  );
};
