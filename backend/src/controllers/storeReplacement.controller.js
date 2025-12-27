const mongoose = require("mongoose");

exports.listReplacements = async (req, res) => {
  try {
    const { resort } = req.query;
    const StoreReplacement = mongoose.models.StoreReplacement;
    const data = await StoreReplacement.find(resort ? { resort } : {}).lean();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Failed to load replacements" });
  }
};

exports.createReplacement = async (req, res) => {
  try {
    const StoreReplacement = mongoose.models.StoreReplacement;
    const doc = await StoreReplacement.create(req.body);
    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ message: "Failed to create replacement" });
  }
};

exports.issueToVendor = async (req, res) => {
  try {
    const StoreReplacement = mongoose.models.StoreReplacement;
    const doc = await StoreReplacement.findByIdAndUpdate(
      req.params.id,
      { status: "SENT_TO_VENDOR", vendorId: req.body.vendorId },
      { new: true }
    );
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: "Failed to issue to vendor" });
  }
};

exports.createReplacementGRN = async (req, res) => {
  try {
    const StoreReplacement = mongoose.models.StoreReplacement;
    const StoreStock = mongoose.models.StoreStock;

    const repl = await StoreReplacement.findById(req.params.id);
    for (const ln of req.body.lines || []) {
      await StoreStock.findOneAndUpdate(
        { store: repl.storeId, item: ln.itemId },
        { $inc: { qty: Number(ln.receivedQty || 0) } },
        { upsert: true }
      );
    }

    repl.status = "CLOSED";
    await repl.save();
    res.json(repl);
  } catch (err) {
    res.status(500).json({ message: "Failed to create replacement GRN" });
  }
};
