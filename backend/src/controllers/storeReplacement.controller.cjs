const mongoose = require("mongoose");

const StoreReplacement = mongoose.models.StoreReplacement;
const StoreStock = mongoose.models.StoreStock;

/* ===============================
   LIST
================================ */
exports.list = async (req, res) => {
  try {
    const { resort } = req.query;
    const filter = {};

    if (resort && resort !== "ALL") filter.resort = resort;

    const docs = await StoreReplacement.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    res.json(docs);
  } catch (err) {
    console.error("LIST STORE REPLACEMENT ❌", err);
    res.status(500).json({ message: "Failed to load replacements" });
  }
};

/* ===============================
   CREATE (ADD REPLACEMENT)
================================ */
exports.create = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      createdBy: req.user?.id || "SYSTEM",
    };

    // 1️⃣ Deduct stock immediately (replacement removed from store)
    for (const ln of payload.lines || []) {
      const stock = await StoreStock.findOne({
        store: payload.storeId,
        item: ln.itemId,
      });

      if (!stock || stock.qty < ln.qty) {
        return res.status(400).json({
          message: "Insufficient stock for replacement",
        });
      }

      await StoreStock.updateOne(
        { _id: stock._id },
        { $inc: { qty: -ln.qty } }
      );
    }

    // 2️⃣ Save replacement
    const doc = await StoreReplacement.create(payload);
    res.status(201).json(doc);
  } catch (err) {
    console.error("CREATE STORE REPLACEMENT ❌", err);
    res.status(500).json({ message: "Failed to create replacement" });
  }
};

/* ===============================
   ISSUE TO VENDOR
================================ */
exports.issueToVendor = async (req, res) => {
  try {
    const { vendorId, lines } = req.body;
    const repl = await StoreReplacement.findById(req.params.id);

    if (!repl) return res.status(404).json({ message: "Replacement not found" });

    repl.vendorId = vendorId;
    repl.status = "SENT_TO_VENDOR";

    repl.lines = repl.lines.map((ln) => {
      const m = lines.find((x) => x.lineId === ln.lineId);
      if (!m) return ln;

      return {
        ...ln.toObject(),
        issuedQty: Number(m.issueQty || 0),
        remark: m.remark || ln.remark,
      };
    });

    await repl.save();
    res.json(repl);
  } catch (err) {
    console.error("ISSUE TO VENDOR ❌", err);
    res.status(500).json({ message: "Failed to issue to vendor" });
  }
};

/* ===============================
   CREATE REPLACEMENT GRN
================================ */
exports.createGrn = async (req, res) => {
  try {
    const { storeId, lines } = req.body;

    const repl = await StoreReplacement.findById(req.params.id);
    if (!repl) return res.status(404).json({ message: "Replacement not found" });

    // 1️⃣ Add received stock back to store
    for (const ln of lines || []) {
      if (!ln.receivedQty || ln.receivedQty <= 0) continue;

      await StoreStock.updateOne(
        { store: storeId, item: ln.itemId },
        { $inc: { qty: ln.receivedQty } },
        { upsert: true }
      );
    }

    // 2️⃣ Update replacement lines
    repl.lines = repl.lines.map((ln) => {
      const m = lines.find((x) => x.lineId === ln.lineId);
      if (!m) return ln;

      return {
        ...ln.toObject(),
        receivedQty: Number(m.receivedQty || 0),
        remark: m.remark || ln.remark,
      };
    });

    repl.status = "CLOSED";
    await repl.save();

    res.json(repl);
  } catch (err) {
    console.error("REPLACEMENT GRN ❌", err);
    res.status(500).json({ message: "Failed to create replacement GRN" });
  }
};
