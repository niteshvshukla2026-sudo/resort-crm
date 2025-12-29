const mongoose = require("mongoose");

const GRN = mongoose.models.GRN;
const PO = mongoose.models.PO;
const Requisition = mongoose.models.Requisition;
const StoreStock = mongoose.models.StoreStock;

/* ===============================
   HELPERS
================================ */
function makeGrnNo() {
  const d = new Date();
  return `GRN-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(
    d.getDate()
  ).padStart(2, "0")}-${Math.floor(100 + Math.random() * 900)}`;
}

/* ===============================
   LIST GRN
================================ */
exports.listGRN = async (req, res) => {
  try {
    const docs = await GRN.find().lean();
    res.json(docs);
  } catch (err) {
    console.error("GET /api/grn", err);
    res.status(500).json({ message: "Failed to fetch GRN" });
  }
};

/* ===============================
   CREATE GRN
   (Requisition OR PO)
================================ */
exports.createGRN = async (req, res) => {
  try {
    const data = req.body || {};

    if (!Array.isArray(data.items) || data.items.length === 0) {
      return res.status(400).json({ message: "GRN items required" });
    }

    const payload = {
      grnNo: data.grnNo || makeGrnNo(),
      poId: data.poId || null,
      requisitionId: data.requisitionId || null,
      vendor: data.vendor || null,
      resort: data.resort || null,
      store: data.store || null,
      grnDate: data.grnDate || new Date(),
      status: "OPEN",
      items: data.items
        .filter((it) => it.item && Number(it.qtyReceived ?? it.receivedQty ?? 0) > 0)
        .map((it) => ({
          item: it.item,
          qtyRequested: Number(it.qtyRequested || 0),
          qtyReceived: Number(it.qtyReceived ?? it.receivedQty),
          remark: it.remark || "",
        })),
    };

    const grn = await GRN.create(payload);

    // 🔁 update requisition
    if (payload.requisitionId && Requisition) {
      await Requisition.findByIdAndUpdate(payload.requisitionId, {
        $set: { status: "GRN_CREATED", grn: grn._id },
      });
    }

    // 🔁 update PO status (if exists)
    if (payload.poId && PO) {
      await PO.findByIdAndUpdate(payload.poId, {
        $set: { status: "CLOSED" },
      });
    }

    res.status(201).json(grn);
  } catch (err) {
    console.error("CREATE GRN ERROR ❌", err);
    res.status(500).json({ message: "Failed to create GRN", error: err.message });
  }
};

/* ===============================
   CLOSE GRN
   → ADD STORE STOCK
================================ */
exports.closeGRN = async (req, res) => {
  try {
    const grnId = req.params.id;

    const grn = await GRN.findById(grnId);
    if (!grn) {
      return res.status(404).json({ message: "GRN not found" });
    }

    if (grn.status === "CLOSED") {
      return res.status(400).json({ message: "GRN already closed" });
    }

    // 🔥 ADD STOCK
    for (const line of grn.items || []) {
      const itemId = line.item;
      const qty = Number(line.qtyReceived || 0);
      const storeId = grn.store;

      if (!itemId || !storeId || qty <= 0) continue;

      await StoreStock.findOneAndUpdate(
        { store: storeId, item: itemId },
        { $inc: { qty } },
        { upsert: true, new: true }
      );
    }

    grn.status = "CLOSED";
    grn.closedAt = new Date();
    await grn.save();

    res.json({
      message: "GRN closed & stock updated",
      grn,
    });
  } catch (err) {
    console.error("CLOSE GRN ERROR ❌", err);
    res.status(500).json({ message: "Failed to close GRN", error: err.message });
  }
};

/* ===============================
   DELETE GRN
================================ */
exports.deleteGRN = async (req, res) => {
  try {
    const id = req.params.id;
    const deleted = await GRN.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "GRN not found" });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("DELETE GRN ERROR", err);
    res.status(500).json({ message: "Failed to delete GRN" });
  }
};
