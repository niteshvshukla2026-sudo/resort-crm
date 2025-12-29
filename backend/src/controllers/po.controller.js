const mongoose = require("mongoose");

const PO = () => mongoose.models.PO;
const Requisition = () => mongoose.models.Requisition;

/* ===============================
   Helpers
================================ */
function makePoNo() {
  const d = new Date();
  return `PO-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(
    d.getDate()
  ).padStart(2, "0")}-${Math.floor(100 + Math.random() * 900)}`;
}

/* ===============================
   LIST
================================ */
exports.listPO = async (req, res) => {
  const docs = await PO().find().lean();
  res.json(docs);
};

/* ===============================
   CREATE (Direct / from Req)
================================ */
exports.createPO = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      poNo: req.body.poNo || makePoNo(),
    };

    const doc = await PO().create(payload);

    if (payload.requisitionId) {
      await Requisition().findByIdAndUpdate(payload.requisitionId, {
        $set: { status: "PO_CREATED" },
      });
    }

    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ message: "Failed to create PO" });
  }
};

/* ===============================
   UPDATE / DELETE
================================ */
exports.updatePO = async (req, res) => {
  const doc = await PO().findByIdAndUpdate(
    req.params.id,
    { $set: { ...req.body, updatedAt: new Date() } },
    { new: true }
  );
  res.json(doc);
};

exports.deletePO = async (req, res) => {
  await PO().findByIdAndDelete(req.params.id);
  res.json({ ok: true });
};
