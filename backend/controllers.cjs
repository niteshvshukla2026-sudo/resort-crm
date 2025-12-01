// backend/controllers.cjs
const { v4: uuidv4 } = require('uuid');

function createControllers({ useMongo, mongoose }) {
  // "db" holds in-memory arrays when not using Mongo
  let db = {
    Requisitions: [],
    POs: [],
    Items: [],
    Resorts: [],
    Users: [],
    Roles: []
  };

  // If using Mongo, create simple models for the demo.
  if (useMongo && mongoose) {
    const Schema = mongoose.Schema;

    const RequisitionSchema = new Schema({
      requisitionNo: String,
      type: { type: String, default: 'INTERNAL' },
      resort: String,
      department: String,
      store: String,
      vendor: String,
      requiredBy: Date,
      createdBy: String,
      createdAt: { type: Date, default: Date.now },
      status: { type: String, default: "Draft" },
      lines: Array
    });

    const POSchema = new Schema({
      poNo: String,
      resort: String,
      store: String,
      vendor: String,
      items: Array,
      status: String,
      poDate: Date,
      createdAt: { type: Date, default: Date.now }
    });

    const ItemSchema = new Schema({
      name: String,
      sku: String,
      stockByStore: Object // { storeId: qty }
    });

    const ResortSchema = new Schema({ name: String });
    const UserSchema = new Schema({ name: String, email: String, role: String, resorts: Array });
    const RoleSchema = new Schema({ name: String, key: String, permissions: Array });

    // Use model names that won't clash; check if model exists to avoid overwrite
    try {
      db.RequisitionModel = mongoose.model('Requisition');
    } catch (e) {
      db.RequisitionModel = mongoose.model('Requisition', RequisitionSchema);
    }

    try {
      db.POModel = mongoose.model('PO');
    } catch (e) {
      db.POModel = mongoose.model('PO', POSchema);
    }

    try {
      db.ItemModel = mongoose.model('Item');
    } catch (e) {
      db.ItemModel = mongoose.model('Item', ItemSchema);
    }

    try {
      db.ResortModel = mongoose.model('Resort');
    } catch (e) {
      db.ResortModel = mongoose.model('Resort', ResortSchema);
    }

    try {
      db.UserModel = mongoose.model('User');
    } catch (e) {
      db.UserModel = mongoose.model('User', UserSchema);
    }

    try {
      db.RoleModel = mongoose.model('Role');
    } catch (e) {
      db.RoleModel = mongoose.model('Role', RoleSchema);
    }
  } else {
    // seed in-memory demo data
    db.Resorts = [
      { _id: 'resort_1', name: 'Blue Lagoon' },
      { _id: 'resort_2', name: 'Palm Haven' }
    ];

    db.Users = [
      { _id: 'user_1', name: 'Amit (Resort User)', email: 'amit@resort.com', role: 'RESORT_USER', resorts: ['resort_1'] }
    ];

    db.Roles = [
      { _id: 'role_system_super', name: 'Super Admin', key: 'SUPER_ADMIN', permissions: [] },
      { _id: 'role_resort_user', name: 'Resort User', key: 'RESORT_USER', permissions: [] }
    ];

    db.Items = [
      { _id: 'item_1', name: 'Milk Powder', sku: 'MK-001', stockByStore: { 'store_1': 20, 'store_2': 5 } },
      { _id: 'item_2', name: 'Shampoo', sku: 'SH-001', stockByStore: { 'store_1': 10, 'store_2': 2 } }
    ];

    db.POs = [
      { _id: 'po_1', poNo: 'PO-1001', resort: 'resort_1', store: 'store_1', vendor: 'vendor_1', status: 'Open', poDate: new Date() }
    ];

    db.Requisitions = [
      {
        _id: 'req_1',
        requisitionNo: 'REQ-1001',
        type: 'INTERNAL',
        resort: 'resort_1',
        store: 'store_1',
        department: '',
        requiredBy: new Date(Date.now() + 3 * 24 * 3600 * 1000),
        createdBy: 'user_1',
        createdAt: new Date(),
        status: 'Submitted',
        lines: [
          { lineId: 'ln1', item: 'item_1', qty: 5, remark: '' },
          { lineId: 'ln2', item: 'item_2', qty: 3, remark: '' }
        ]
      }
    ];
  }

  // --- Controllers ---

  const getResortKpi = async (req, res) => {
    const resortId = req.params.resortId;
    try {
      if (useMongo) {
        const openReqs = await db.RequisitionModel.countDocuments({ resort: resortId, status: { $in: ['Submitted', 'Draft', 'Partially Approved'] }});
        const pendingApprovals = await db.RequisitionModel.countDocuments({ resort: resortId, status: 'Submitted' });
        const openPOs = await db.POModel.countDocuments({ resort: resortId, status: { $in: ['Open', 'Partially Received'] }});
        const items = await db.ItemModel.find({}).lean();
        const lowStockCount = items.reduce((acc, it) => {
          const vals = Object.values(it.stockByStore || {});
          if (vals.some(v => v < 5)) return acc + 1;
          return acc;
        }, 0);
        return res.json({ openRequisitions: openReqs, pendingApprovals, openPOs, lowStockCount });
      } else {
        const openRequisitions = db.Requisitions.filter(r => r.resort === resortId && ['Submitted','Draft','Partially Approved'].includes(r.status)).length;
        const pendingApprovals = db.Requisitions.filter(r => r.resort === resortId && r.status === 'Submitted').length;
        const openPOs = db.POs.filter(p => p.resort === resortId && ['Open','Partially Received'].includes(p.status)).length;
        const lowStockCount = db.Items.reduce((acc, it) => {
          const vals = Object.values(it.stockByStore || {});
          if (vals.some(v => v < 5)) return acc + 1;
          return acc;
        }, 0);
        return res.json({ openRequisitions, pendingApprovals, openPOs, lowStockCount });
      }
    } catch (e) {
      console.error(e);
      res.status(500).send('KPI error');
    }
  };

  const listResorts = async (req, res) => {
    try {
      if (useMongo) {
        const docs = await db.ResortModel.find({});
        return res.json(docs);
      } else {
        return res.json(db.Resorts);
      }
    } catch (e) {
      console.error(e);
      res.status(500).send('Failed to list resorts');
    }
  };

  const listRequisitions = async (req, res) => {
    try {
      const { createdBy, resort } = req.query;
      if (useMongo) {
        const q = {};
        if (createdBy) q.createdBy = createdBy;
        if (resort) q.resort = resort;
        const docs = await db.RequisitionModel.find(q).sort({ createdAt: -1 }).limit(200);
        return res.json(docs);
      } else {
        let out = db.Requisitions.slice();
        if (createdBy) out = out.filter(r => r.createdBy === createdBy);
        if (resort) out = out.filter(r => r.resort === resort);
        return res.json(out);
      }
    } catch (e) {
      console.error(e);
      res.status(500).send('Failed to list requisitions');
    }
  };

  const createRequisition = async (req, res) => {
    try {
      const payload = req.body;
      if (!payload.resort) return res.status(400).send({ message: 'resort required' });
      if (!payload.lines || !Array.isArray(payload.lines) || payload.lines.length === 0) return res.status(400).send({ message: 'lines required' });

      if (useMongo) {
        const newReq = await db.RequisitionModel.create({
          requisitionNo: `REQ-${Math.floor(Math.random() * 9000) + 1000}`,
          ...payload,
          createdBy: req.user?.id || payload.createdBy || 'system',
          createdAt: new Date(),
          status: 'Submitted'
        });
        return res.json(newReq);
      } else {
        const id = uuidv4();
        const newReq = {
          _id: id,
          requisitionNo: `REQ-${Math.floor(Math.random() * 9000) + 1000}`,
          ...payload,
          createdBy: (req.user && req.user.id) || payload.createdBy || 'demo_user',
          createdAt: new Date(),
          status: 'Submitted'
        };
        db.Requisitions.unshift(newReq);
        return res.json(newReq);
      }
    } catch (e) {
      console.error(e);
      res.status(500).send('Failed to create requisition');
    }
  };

  const listPOs = async (req, res) => {
    try {
      const { resort } = req.query;
      if (useMongo) {
        const q = {};
        if (resort) q.resort = resort;
        const docs = await db.POModel.find(q).sort({ createdAt: -1 }).limit(200);
        return res.json(docs);
      } else {
        let out = db.POs.slice();
        if (resort) out = out.filter(p => p.resort === resort);
        return res.json(out);
      }
    } catch (e) {
      console.error(e);
      res.status(500).send('Failed to list POs');
    }
  };

  const listItems = async (req, res) => {
    try {
      if (useMongo) {
        const docs = await db.ItemModel.find({}).limit(500);
        return res.json(docs);
      } else {
        return res.json(db.Items);
      }
    } catch (e) {
      console.error(e);
      res.status(500).send('Failed to list items');
    }
  };

  const listRoles = async (req, res) => {
    try {
      if (useMongo) {
        const docs = await db.RoleModel.find({});
        return res.json(docs);
      } else {
        return res.json(db.Roles);
      }
    } catch (e) {
      console.error(e);
      res.status(500).send('Failed to list roles');
    }
  };

  const listUsers = async (req, res) => {
    try {
      if (useMongo) {
        const docs = await db.UserModel.find({});
        return res.json(docs);
      } else {
        return res.json(db.Users);
      }
    } catch (e) {
      console.error(e);
      res.status(500).send('Failed to list users');
    }
  };

  return {
    getResortKpi,
    listResorts,
    listRequisitions,
    createRequisition,
    listPOs,
    listItems,
    listRoles,
    listUsers
  };
}

module.exports = { createControllers };
