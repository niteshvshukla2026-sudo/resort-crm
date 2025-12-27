// backend/controllers/requisition.controller.cjs
module.exports = function (mongoose) {
  const Requisition = mongoose.model("Requisition");

  const generateReqNo = () =>
    `REQ-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

  return {
    list: async (req, res) => {
      const filter = {};
      if (req.query.resort && req.query.resort !== "ALL") {
        filter.resort = req.query.resort;
      }
      const docs = await Requisition.find(filter).lean();
      res.json(docs);
    },

    create: async (req, res) => {
      const doc = await Requisition.create({
        requisitionNo: generateReqNo(),
        ...req.body,
        status: "PENDING",
        createdBy: req.user?.id,
      });
      res.status(201).json(doc);
    },

    update: async (req, res) => {
      const doc = await Requisition.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );
      if (!doc) return res.status(404).json({ message: "Not found" });
      res.json(doc);
    },

    remove: async (req, res) => {
      await Requisition.findByIdAndDelete(req.params.id);
      res.json({ ok: true });
    },

    approve: async (req, res) => {
      const doc = await Requisition.findByIdAndUpdate(
        req.params.id,
        {
          status: "APPROVED",
          approvedBy: req.user?.id,
          approvedAt: new Date(),
        },
        { new: true }
      );
      res.json(doc);
    },

    reject: async (req, res) => {
      const doc = await Requisition.findByIdAndUpdate(
        req.params.id,
        {
          status: "REJECTED",
          rejectedBy: req.user?.id,
          rejectionReason: req.body.reason,
        },
        { new: true }
      );
      res.json(doc);
    },
  };
};
