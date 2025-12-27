// backend/controllers/po.controller.cjs
module.exports = function (mongoose) {
  const PO = mongoose.model("PO");
  const Requisition = mongoose.model("Requisition");

  const makePoNo = () => `PO-${Date.now()}`;

  return {
    createFromRequisition: async (req, res) => {
      const reqDoc = await Requisition.findById(req.params.id);
      if (!reqDoc || reqDoc.status !== "APPROVED") {
        return res.status(400).json({ message: "Invalid requisition" });
      }

      const po = await PO.create({
        poNo: makePoNo(),
        requisition: reqDoc._id,
        vendor: reqDoc.vendor,
        resort: reqDoc.resort,
        deliverTo: reqDoc.store,
        items: reqDoc.lines,
      });

      await Requisition.findByIdAndUpdate(reqDoc._id, {
        status: "PO_CREATED",
      });

      res.status(201).json(po);
    },
  };
};
