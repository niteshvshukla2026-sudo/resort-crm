import mongoose from "mongoose";

const StoreReplacement = mongoose.models.StoreReplacement;
const StoreStock = mongoose.models.StoreStock;

/* =========================================
   LIST (RESORT WISE)
========================================= */
export const listReplacements = async (req, res) => {
  try {
    const { resort } = req.query;
    const filter = {};
    if (resort && resort !== "ALL") filter.resort = resort;

    const docs = await StoreReplacement.find(filter).lean();
    res.json(docs);
  } catch (err) {
    console.error("LIST REPLACEMENT ❌", err);
    res.status(500).json({ message: "Failed to fetch replacements" });
  }
};

/* =========================================
   CREATE (ADD REPLACEMENT)
========================================= */
export const createReplacement = async (req, res) => {
  try {
    const doc = await StoreReplacement.create(req.body);
    res.status(201).json(doc);
  } catch (err) {
    console.error("CREATE REPLACEMENT ❌", err);
    res.status(500).json({ message: err.message });
  }
};

/* =========================================
   ISSUE TO VENDOR (STEP 2)
========================================= */
export const issueToVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const { vendorId, lines } = req.body;

    const repl = await StoreReplacement.findById(id);
    if (!repl) return res.status(404).json({ message: "Replacement not found" });

    repl.vendorId = vendorId;
    repl.status = "SENT_TO_VENDOR";

    repl.lines = repl.lines.map((ln) => {
      const match = lines.find((l) => l.lineId === ln.lineId);
      if (!match) return ln;
      return {
        ...ln.toObject(),
        issuedQty: Number(match.issueQty || 0),
        remark: match.remark || ln.remark,
      };
    });

    await repl.save();
    res.json(repl);
  } catch (err) {
    console.error("ISSUE TO VENDOR ❌", err);
    res.status(500).json({ message: err.message });
  }
};

/* =========================================
   CREATE GRN (STEP 3) + 🔥 STOCK PLUS
========================================= */
export const createReplacementGrn = async (req, res) => {
  try {
    const { id } = req.params;
    const { storeId, lines } = req.body;

    const repl = await StoreReplacement.findById(id);
    if (!repl) return res.status(404).json({ message: "Replacement not found" });

    // 🔁 UPDATE LINES + ADD STOCK
    for (const ln of lines) {
      const qty = Number(ln.receivedQty || 0);
      if (qty <= 0) continue;

      // 🔥 ADD STOCK
      await StoreStock.findOneAndUpdate(
        { store: storeId, item: ln.itemId },
        { $inc: { qty } },
        { upsert: true, new: true }
      );

      // update replacement line
      const target = repl.lines.find((x) => x.lineId === ln.lineId);
      if (target) {
        target.receivedQty = qty;
        target.remark = ln.remark || target.remark;
      }
    }

    repl.status = "CLOSED";
    await repl.save();

    res.json(repl);
  } catch (err) {
    console.error("REPLACEMENT GRN ❌", err);
    res.status(500).json({ message: err.message });
  }
};
