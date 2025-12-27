// src/controllers/requisition.controller.js
const mongoose = require('mongoose');
const Requisition = require('../models/requisition.model');
const Store = require('../models/store.model');
const GRN = require('../models/Grn'); // ✅ Correct GRN model (poId OPTIONAL)

function generateRequisitionNo() {
  return `REQ-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

const isValidId = (id) => mongoose.Types.ObjectId.isValid(String(id));

/**
 * GET /api/requisitions
 */
exports.getAll = async (req, res) => {
  try {
    const list = await Requisition.find()
      .populate('vendor')
      .populate('fromStore')
      .populate('toStore')
      .populate('store')
      .populate('resort')
      .populate('department')
      .populate('lines.item')
      .populate('po')
      .populate('grn')
      .sort({ createdAt: -1 });

    res.json(list);
  } catch (err) {
    console.error('getAll requisitions error:', err);
    res.status(500).json({ message: 'Failed to fetch requisitions', error: err.message });
  }
};

/**
 * GET /api/requisitions/:id
 */
exports.getOne = async (req, res) => {
  try {
    const rec = await Requisition.findById(req.params.id)
      .populate('vendor')
      .populate('fromStore')
      .populate('toStore')
      .populate('store')
      .populate('resort')
      .populate('department')
      .populate('lines.item')
      .populate('grn');

    if (!rec) return res.status(404).json({ message: 'Requisition not found' });
    res.json(rec);
  } catch (err) {
    console.error('getOne requisition error:', err);
    res.status(500).json({ message: 'Failed to fetch requisition', error: err.message });
  }
};

/**
 * POST /api/requisitions
 */
exports.create = async (req, res) => {
  try {
    const body = req.body || {};
    const {
      type,
      resort,
      vendor,
      store,
      fromStore,
      toStore,
      department,
      requiredBy,
      lines,
      requisitionNo,
    } = body;

    if (!type || !['INTERNAL', 'VENDOR'].includes(type)) {
      return res.status(400).json({ message: 'Invalid or missing type' });
    }

    if (type === 'VENDOR') {
      if (!vendor || !isValidId(vendor)) {
        return res.status(400).json({ message: 'Missing/invalid vendor' });
      }
      if (!store || !isValidId(store)) {
        return res.status(400).json({ message: 'Missing/invalid store' });
      }
    }

    if (type === 'INTERNAL') {
      if (!fromStore || !toStore) {
        return res.status(400).json({ message: 'Missing fromStore / toStore' });
      }
    }

    let parsedRequiredBy;
    if (requiredBy) {
      const dt = new Date(requiredBy);
      if (isNaN(dt.getTime())) {
        return res.status(400).json({ message: 'Invalid requiredBy date' });
      }
      parsedRequiredBy = dt;
    }

    if (!Array.isArray(lines) || lines.length === 0) {
      return res.status(400).json({ message: 'Lines required' });
    }

    const normalizedLines = lines.map((ln, i) => {
      if (!ln.item || !isValidId(ln.item)) {
        throw new Error(`Line ${i}: invalid item`);
      }
      if (!ln.qty || Number(ln.qty) <= 0) {
        throw new Error(`Line ${i}: invalid qty`);
      }
      return {
        itemCategory: ln.itemCategory || undefined,
        item: ln.item,
        qty: Number(ln.qty),
        remark: ln.remark || '',
      };
    });

    const doc = {
      requisitionNo: requisitionNo || generateRequisitionNo(),
      type,
      resort: resort || undefined,
      department: department || undefined,
      requiredBy: parsedRequiredBy,
      lines: normalizedLines,
    };

    if (type === 'VENDOR') {
      doc.vendor = vendor;
      doc.store = store;
    } else {
      doc.fromStore = fromStore;
      doc.toStore = toStore;
    }

    const newReq = await Requisition.create(doc);

    const full = await Requisition.findById(newReq._id)
      .populate('vendor')
      .populate('fromStore')
      .populate('toStore')
      .populate('store')
      .populate('resort')
      .populate('department')
      .populate('lines.item');

    res.status(201).json(full);
  } catch (err) {
    console.error('create requisition error:', err);
    res.status(500).json({ message: 'Failed to create requisition', error: err.message });
  }
};

/**
 * PUT /api/requisitions/:id
 */
exports.update = async (req, res) => {
  try {
    await Requisition.findByIdAndUpdate(req.params.id, req.body, { runValidators: true });
    const full = await Requisition.findById(req.params.id)
      .populate('vendor')
      .populate('fromStore')
      .populate('toStore')
      .populate('store')
      .populate('resort')
      .populate('department')
      .populate('lines.item')
      .populate('grn');

    res.json(full);
  } catch (err) {
    console.error('update requisition error:', err);
    res.status(500).json({ message: 'Failed to update requisition', error: err.message });
  }
};

/**
 * DELETE /api/requisitions/:id
 */
exports.delete = async (req, res) => {
  try {
    await Requisition.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('delete requisition error:', err);
    res.status(500).json({ message: 'Failed to delete requisition', error: err.message });
  }
};

/**
 * POST /api/requisitions/:id/approve
 */
exports.approve = async (req, res) => {
  try {
    await Requisition.findByIdAndUpdate(req.params.id, { status: 'APPROVED' });
    const updated = await Requisition.findById(req.params.id);
    res.json(updated);
  } catch (err) {
    console.error('approve requisition error:', err);
    res.status(500).json({ message: 'Failed to approve requisition', error: err.message });
  }
};

/**
 * POST /api/requisitions/:id/hold
 */
exports.hold = async (req, res) => {
  try {
    await Requisition.findByIdAndUpdate(req.params.id, { status: 'ON_HOLD' });
    const updated = await Requisition.findById(req.params.id);
    res.json(updated);
  } catch (err) {
    console.error('hold requisition error:', err);
    res.status(500).json({ message: 'Failed to hold requisition', error: err.message });
  }
};

/**
 * POST /api/requisitions/:id/reject
 */
exports.reject = async (req, res) => {
  try {
    await Requisition.findByIdAndUpdate(req.params.id, {
      status: 'REJECTED',
      rejectionReason: req.body.reason || '',
    });
    const updated = await Requisition.findById(req.params.id);
    res.json(updated);
  } catch (err) {
    console.error('reject requisition error:', err);
    res.status(500).json({ message: 'Failed to reject requisition', error: err.message });
  }
};

/**
 * POST /api/requisitions/:id/create-grn
 * Create GRN directly from requisition (NO poId required)
 */
exports.createGRN = async (req, res) => {
  try {
    const {
      grnNo,
      receivedBy,
      receivedDate,
      challanNo,
      billNo,
      store,
      items,
    } = req.body || {};

    if (!grnNo || !receivedDate || !challanNo || !store) {
      return res.status(400).json({ message: 'Missing required GRN fields' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'GRN items required' });
    }

    const requisition = await Requisition.findById(req.params.id);
    if (!requisition) {
      return res.status(404).json({ message: 'Requisition not found' });
    }

    const grn = await GRN.create({
      grnNo,
      requisition: requisition._id,
      resort: requisition.resort || null,
      store,
      receivedBy,
      receivedDate,
      challanNo,
      billNo,
      items: items.map((it) => ({
        item: it.item,
        qtyRequested: it.qtyRequested || 0,
        qtyReceived: it.qtyReceived || 0,
        remark: it.remark || '',
      })),
      status: 'CREATED',
    });

    requisition.status = 'GRN_CREATED';
    requisition.grn = grn._id;
    await requisition.save();

    res.status(201).json(grn);
  } catch (err) {
    console.error('create GRN error:', err);
    res.status(500).json({ message: 'Failed to create GRN', error: err.message });
  }
};
