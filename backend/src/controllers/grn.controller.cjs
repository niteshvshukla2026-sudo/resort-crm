// backend/controllers/grn.controller.cjs
module.exports = function (mongoose) {
  const GRN = mongoose.model("GRN");
  const Requisition = mongoose.model("Requisition");

  const makeGrnNo = () => `GRN-${Date.now()}`;

  return {
    createFromRequisition: async (req, res) => {
      const reqDoc = await Requisition.findById(req.params.id);
      if (!reqDoc) {
        return res.status(404).json({ message: "Requisition not found" });
      }

      const grn = await GRN.create({
        grnNo: makeGrnNo(),
        requisition: reqDoc._id,
        vendor: reqDoc.vendor,
        resort: reqDoc.resort,
        store: req.body.store || reqDoc.store,
        items: req.body.items,
      });

      await Requisition.findByIdAndUpdate(reqDoc._id, {
        status: "GRN_CREATED",
      });

      res.status(201).json(grn);
    },
  };
};
