// controllers/requisition.controller.js
const mongoose = require('mongoose');
const Requisition = require('../models/requisition.model');
const Store = require('../models/store.model');

function generateRequisitionNo() {
  return `REQ-${Date.now()}`;
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
    console.error('getAll requisitions error:', err && err.stack ? err.stack : err);
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
      .populate('lines.item');

    if (!rec) return res.status(404).json({ message: 'Requisition not found' });
    res.json(rec);
  } catch (err) {
    console.error('getOne requisition error:', err && err.stack ? err.stack : err);
    res.status(500).json({ message: 'Failed to fetch requisition', error: err.message });
  }
};

/**
 * POST /api/requisitions
 * Validates input, creates requisition and returns populated doc
 */
exports.create = async (req, res) => {
  try {
    const body = req.body || {};
    console.log('--- createRequisition incoming body ---');
    console.log(JSON.stringify(body, null, 2));

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

    // validate type
    if (!type || !['INTERNAL', 'VENDOR'].includes(type)) {
      return res.status(400).json({ message: 'Invalid or missing "type".' });
    }

    // VENDOR-specific validation
    if (type === 'VENDOR') {
      if (!vendor || !isValidId(vendor)) {
        return res.status(400).json({ message: 'Missing or invalid "vendor" id.' });
      }
      if (!store || !isValidId(store)) {
        return res.status(400).json({ message: 'Missing or invalid "store" id.' });
      }
    }

    // INTERNAL-specific validation
    if (type === 'INTERNAL') {
      if (!fromStore || !isValidId(fromStore) || !toStore || !isValidId(toStore)) {
        return res.status(400).json({ message: 'Missing or invalid "fromStore"/"toStore" ids.' });
      }
    }

    // optional resort validate
    if (resort && !isValidId(resort)) {
      return res.status(400).json({ message: 'Invalid "resort" id.' });
    }

    // requiredBy (date) validate
    let parsedRequiredBy = undefined;
    if (requiredBy) {
      const dt = new Date(requiredBy);
      if (isNaN(dt.getTime())) {
        return res.status(400).json({ message: 'Invalid "requiredBy" date.' });
      }
      parsedRequiredBy = dt;
    }

    // lines validate
    if (!Array.isArray(lines) || lines.length === 0) {
      return res.status(400).json({ message: 'Requisition must contain at least one line in "lines".' });
    }

    const normalizedLines = [];
    for (let i = 0; i < lines.length; i++) {
      const ln = lines[i] || {};
      const item = ln.item;
      const qty = ln.qty;

      if (!item || !isValidId(item)) {
        return res.status(400).json({ message: `Line ${i}: missing/invalid "item" id.` });
      }
      const qtyNum = Number(qty);
      if (!Number.isFinite(qtyNum) || qtyNum <= 0) {
        return res.status(400).json({ message: `Line ${i}: "qty" must be a positive number.` });
      }

      let itemCategory = ln.itemCategory;
      if (itemCategory && !isValidId(itemCategory)) {
        return res.status(400).json({ message: `Line ${i}: invalid "itemCategory" id.` });
      }

      normalizedLines.push({
        itemCategory: itemCategory || undefined,
        item: item,
        qty: qtyNum,
        remark: ln.remark || ''
      });
    }

    // Build document to save
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

    // Save
    const newReq = new Requisition(doc);
    await newReq.save();

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
    console.error('create requisition error:', err && err.stack ? err.stack : err);
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
      .populate('lines.item');

    res.json(full);
  } catch (err) {
    console.error('update requisition error:', err && err.stack ? err.stack : err);
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
    console.error('delete requisition error:', err && err.stack ? err.stack : err);
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
    console.error('approve requisition error:', err && err.stack ? err.stack : err);
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
    console.error('hold requisition error:', err && err.stack ? err.stack : err);
    res.status(500).json({ message: 'Failed to put requisition on hold', error: err.message });
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
    console.error('reject requisition error:', err && err.stack ? err.stack : err);
    res.status(500).json({ message: 'Failed to reject requisition', error: err.message });
  }
};
