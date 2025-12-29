const mongoose = require("mongoose");

const Requisition = () => mongoose.models.Requisition;

/* ===============================
   Helpers
================================ */
function makeReqNo() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const rand = Math.floor(100 + Math.random() * 900);
  return `REQ-${y}${m}${day}-${rand}`;
}

/* ===============================
   LIST
================================ */
exports.listRequisitions = async (req, res) => {
  try {
    const { resort } = req.query;
    const filter = {};

    if (resort && resort !== "ALL") {
      filter.resort = resort;
    }

    const docs = await Requisition().find(filter).lean();
    res.json(docs);
  } catch (err) {
    console.error("LIST REQUISITIONS", err);
    res.status(500).json({ message: "Failed to fetch requisitions" });
  }
};

/* ===============================
   GET ONE
================================ */
exports.getRequisition = async (req, res) => {
  try {
    const doc = await Requisition().findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ message: "Requisition not found" });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch requisition" });
  }
};

/* ===============================
   CREATE
================================ */
exports.createRequisition = async (req, res) => {
  try {
    const doc = await Requisition().create({
      requisitionNo: makeReqNo(),
      type: req.body.type,
      resort: new mongoose.Types.ObjectId(req.body.resort),
      department: req.body.department,
      fromStore: req.body.fromStore,
      toStore: req.body.toStore,
      store: req.body.store,
      vendor: req.body.vendor,
      requiredBy: req.body.requiredBy,
      status: "PENDING",
      lines: req.body.lines || [],
      createdBy: "SYSTEM",
    });

    res.status(201).json(doc);
  } catch (err) {
    console.error("CREATE REQUISITION", err);
    res.status(500).json({ message: err.message });
  }
};

/* ===============================
   UPDATE
================================ */
exports.updateRequisition = async (req, res) => {
  try {
    const updated = await Requisition().findByIdAndUpdate(
      req.params.id,
      { $set: { ...req.body, updatedAt: new Date() } },
      { new: true }
    );

    if (!updated)
      return res.status(404).json({ message: "Requisition not found" });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Failed to update requisition" });
  }
};

/* ===============================
   DELETE
================================ */
exports.deleteRequisition = async (req, res) => {
  try {
    const deleted = await Requisition().findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ message: "Requisition not found" });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ message: "Failed to delete requisition" });
  }
};

/* ===============================
   APPROVE / HOLD / REJECT
================================ */
exports.approveRequisition = async (req, res) => {
  const doc = await Requisition().findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        status: "APPROVED",
        approvedBy: req.user?.id || "SYSTEM",
        approvedAt: new Date(),
      },
    },
    { new: true }
  );
  res.json(doc);
};

exports.holdRequisition = async (req, res) => {
  const doc = await Requisition().findByIdAndUpdate(
    req.params.id,
    { $set: { status: "ON_HOLD" } },
    { new: true }
  );
  res.json(doc);
};

exports.rejectRequisition = async (req, res) => {
  const doc = await Requisition().findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        status: "REJECTED",
        rejectedBy: req.user?.id || "SYSTEM",
        rejectionReason: req.body.reason || "",
      },
    },
    { new: true }
  );
  res.json(doc);
};
