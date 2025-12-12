const Requisition = require("../models/requisition.model");
const Store = require("../models/store.model");

function generateRequisitionNo() {
  return `REQ-${Date.now()}`;
}

/**
 * GET ALL (with resort-wise filtering)
 * /api/requisitions?resort=ID
 */
exports.getAll = async (req, res) => {
  try {
    const filter = {};

    // 🔥 Resort filter
    if (req.query.resort) {
      filter.resort = req.query.resort;
    }

    const list = await Requisition.find(filter)
      .populate("vendor")
      .populate("fromStore")
      .populate("toStore")
      .populate("store")
      .populate("resort")
      .populate("department")
      .populate("lines.item")
      .populate("po")
      .populate("grn")
      .sort({ createdAt: -1 });

    res.json(list);
  } catch (err) {
    console.error("Requisition getAll error:", err);
    res.status(500).json({ message: "Failed to load requisitions" });
  }
};

/**
 * GET ONE
 */
exports.getOne = async (req, res) => {
  try {
    const rec = await Requisition.findById(req.params.id)
      .populate("vendor")
      .populate("fromStore")
      .populate("toStore")
      .populate("store")
      .populate("resort")
      .populate("department")
      .populate("lines.item");

    res.json(rec);
  } catch (err) {
    console.error("Requisition getOne error:", err);
    res.status(500).json({ message: "Failed to load requisition" });
  }
};

/**
 * CREATE REQUISITION
 * Auto-assign resort using store / toStore
 */
exports.create = async (req, res) => {
  try {
    const body = req.body;

    // 🔥 Auto-fill resort based on store selection
    if (!body.resort) {
      if (body.store) {
        const store = await Store.findById(body.store);
        if (store) body.resort = store.resort;
      }

      // INTERNAL REQUISITION: use fromStore or toStore
      if (!body.resort && body.fromStore) {
        const store = await Store.findById(body.fromStore);
        if (store) body.resort = store.resort;
      }

      if (!body.resort && body.toStore) {
        const store = await Store.findById(body.toStore);
        if (store) body.resort = store.resort;
      }
    }

    const newReq = new Requisition({
      ...body,
      requisitionNo: generateRequisitionNo(),
    });

    await newReq.save();

    const full = await Requisition.findById(newReq._id)
      .populate("vendor")
      .populate("fromStore")
      .populate("toStore")
      .populate("store")
      .populate("resort")
      .populate("department")
      .populate("lines.item");

    res.json(full);
  } catch (err) {
    console.error("Requisition create error:", err);
    res.status(500).json({ message: "Failed to create requisition" });
  }
};

/**
 * UPDATE REQUISITION
 * Also auto-correct resort if store is changed
 */
exports.update = async (req, res) => {
  try {
    const body = req.body;

    // 🔥 Auto-update resort if store changed
    if (body.store) {
      const store = await Store.findById(body.store);
      if (store) body.resort = store.resort;
    }

    // For INTERNAL requisition update
    if (!body.resort && body.fromStore) {
      const store = await Store.findById(body.fromStore);
      if (store) body.resort = store.resort;
    }
    if (!body.resort && body.toStore) {
      const store = await Store.findById(body.toStore);
      if (store) body.resort = store.resort;
    }

    await Requisition.findByIdAndUpdate(req.params.id, body);

    const full = await Requisition.findById(req.params.id)
      .populate("vendor")
      .populate("fromStore")
      .populate("toStore")
      .populate("store")
      .populate("resort")
      .populate("department")
      .populate("lines.item");

    res.json(full);
  } catch (err) {
    console.error("Requisition update error:", err);
    res.status(500).json({ message: "Failed to update requisition" });
  }
};

/**
 * DELETE
 */
exports.delete = async (req, res) => {
  try {
    await Requisition.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error("Requisition delete error:", err);
    res.status(500).json({ message: "Failed to delete requisition" });
  }
};

/**
 * STATUS UPDATES
 */
exports.approve = async (req, res) => {
  try {
    await Requisition.findByIdAndUpdate(req.params.id, { status: "APPROVED" });
    const updated = await Requisition.findById(req.params.id);
    res.json(updated);
  } catch (err) {
    console.error("Requisition approve error:", err);
    res.status(500).json({ message: "Failed to approve requisition" });
  }
};

exports.hold = async (req, res) => {
  try {
    await Requisition.findByIdAndUpdate(req.params.id, { status: "ON_HOLD" });
    const updated = await Requisition.findById(req.params.id);
    res.json(updated);
  } catch (err) {
    console.error("Requisition hold error:", err);
    res.status(500).json({ message: "Failed to hold requisition" });
  }
};

exports.reject = async (req, res) => {
  try {
    await Requisition.findByIdAndUpdate(req.params.id, {
      status: "REJECTED",
      rejectionReason: req.body.reason || "",
    });

    const updated = await Requisition.findById(req.params.id);
    res.json(updated);
  } catch (err) {
    console.error("Requisition reject error:", err);
    res.status(500).json({ message: "Failed to reject requisition" });
  }
};
