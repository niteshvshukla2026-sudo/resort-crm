const express = require("express");
const permit = require("../middlewares/permit.cjs");

module.exports = function requisitionRoutes(router, { Requisition }) {

  // LIST
  router.get(
    "/api/requisitions",
    permit("REQUISITIONS", "READ"),
    async (req, res) => {
      const data = await Requisition.find().lean();
      res.json(data);
    }
  );

  // CREATE
  router.post(
    "/api/requisitions",
    permit("REQUISITIONS", "CREATE"),
    async (req, res) => {
      const doc = await Requisition.create(req.body);
      res.status(201).json(doc);
    }
  );

  // UPDATE
  router.put(
    "/api/requisitions/:id",
    permit("REQUISITIONS", "UPDATE"),
    async (req, res) => {
      const doc = await Requisition.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );
      res.json(doc);
    }
  );

  // DELETE
  router.delete(
    "/api/requisitions/:id",
    permit("REQUISITIONS", "DELETE"),
    async (req, res) => {
      await Requisition.findByIdAndDelete(req.params.id);
      res.json({ ok: true });
    }
  );

  // APPROVE
  router.post(
    "/api/requisitions/:id/approve",
    permit("REQUISITIONS", "APPROVE"),
    async (req, res) => {
      const doc = await Requisition.findByIdAndUpdate(
        req.params.id,
        {
          status: "APPROVED",
          approvedBy: req.user.id,
          approvedAt: new Date(),
        },
        { new: true }
      );
      res.json(doc);
    }
  );
};
