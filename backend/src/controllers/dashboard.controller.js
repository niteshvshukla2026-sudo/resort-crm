const mongoose = require("mongoose");

exports.getResortKpi = async (req, res) => {
  try {
    const { resortId } = req.params;
    const Requisition = mongoose.models.Requisition;
    const PO = mongoose.models.PO;
    const GRN = mongoose.models.GRN;

    const [reqCount, poCount, grnCount] = await Promise.all([
      Requisition.countDocuments({ resort: resortId }),
      PO.countDocuments({ resort: resortId }),
      GRN.countDocuments({ resort: resortId }),
    ]);

    res.json({ requisitions: reqCount, pos: poCount, grns: grnCount });
  } catch (err) {
    res.status(500).json({ message: "Failed to load dashboard KPI" });
  }
};
