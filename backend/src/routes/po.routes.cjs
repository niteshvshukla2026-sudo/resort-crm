const express = require("express");
const permit = require("../middlewares/permit.cjs");

module.exports = function poRoutes(router, { PO, Requisition }) {

  // LIST
  router.get(
    "/api/po",
    permit("PO", "READ"),
    async (req, res) => {
      const data = await PO.find().lean();
      res.json(data);
    }
  );

  // CREATE FROM REQUISITION
  router.post(
    "/api/requisitions/:id/create-po",
    permit("PO", "CREATE"),
    async (req, res) => {
      const reqDoc = await Requisition.findById(req.params.id);
      if (!reqDoc || reqDoc.status !== "APPROVED") {
        return res.status(400).json({ message: "Invalid requisition" });
      }

      const po = await PO.create({
        requisitionId: reqDoc._id,
        vendor: reqDoc.vendor,
        resort: reqDoc.resort,
        deliverTo: reqDoc.store,
        items: reqDoc.lines,
      });

      reqDoc.status = "PO_CREATED";
      await reqDoc.save();

      res.status(201).json(po);
    }
  );

  // UPDATE PO
  router.put(
    "/api/po/:id",
    permit("PO", "UPDATE"),
    async (req, res) => {
      const doc = await PO.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );
      res.json(doc);
    }
  );

  // DELETE PO
  router.delete(
    "/api/po/:id",
    permit("PO", "DELETE"),
    async (req, res) => {
      await PO.findByIdAndDelete(req.params.id);
      res.json({ ok: true });
    }
  );
};
