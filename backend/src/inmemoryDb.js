
/**
 * Simple in-memory DB for local demo/testing without Mongo.
 * Data is stored in JS objects/arrays. This module exposes CRUD-like functions.
 * Note: Not persistent across server restarts.
 */

const db = {
  users: [],
  resorts: [],
  departments: [],
  stores: [],
  items: [],
  vendors: [],
  requisitions: [],
  po: [],
  grn: [],
};

// Helper to generate IDs
const id = (prefix) => `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

// Seed function
function seed() {
  // Clear existing
  db.users = [];
  db.resorts = [];
  db.departments = [];
  db.stores = [];
  db.items = [];
  db.vendors = [];
  db.requisitions = [];
  db.po = [];
  db.grn = [];

  // Resorts
  db.resorts.push({ _id: "resort_1", name: "Beachside Resort" });
  db.resorts.push({ _id: "resort_2", name: "Hillview Resort" });

  // Users (normal resort user and approver)
  db.users.push({
    _id: "user_1",
    username: "resort.user",
    name: "Resort User",
    role: "resort_user",
    resorts: ["resort_1", "resort_2"],
  });
  db.users.push({
    _id: "user_approver",
    username: "approver.user",
    name: "Approver User",
    role: "approver",
    resorts: ["resort_1"],
  });

  // Departments & stores
  db.departments.push({ _id: "dept_1", name: "F&B", resort: "resort_1" });
  db.stores.push({ _id: "store_1", name: "Main Store", resort: "resort_1" });

  // Items
  db.items.push({ _id: "item_1", name: "Rice (5kg)", uom: "kg", stockByStore: { store_1: 100 } });
  db.items.push({ _id: "item_2", name: "Sugar (1kg)", uom: "kg", stockByStore: { store_1: 50 } });

  // Vendors
  db.vendors.push({ _id: "vendor_1", name: "ABC Supplies" });

  // Example requisition (submitted)
  const reqId = id('req');
  db.requisitions.push({
    _id: reqId,
    requisitionNo: "REQ-1001",
    resort: "resort_1",
    department: "dept_1",
    createdBy: "user_1",
    date: new Date().toISOString(),
    requiredBy: new Date(Date.now() + 3*24*3600*1000).toISOString(),
    status: "Submitted",
    lines: [
      { lineId: id('l'), item: "item_1", qty: 10, remark: "" },
      { lineId: id('l'), item: "item_2", qty: 5, remark: "" },
    ],
  });

  // Example PO (from requisition)
  const poId = id('po');
  db.po.push({
    _id: poId,
    poNo: "PO-2001",
    resort: "resort_1",
    vendor: "vendor_1",
    date: new Date().toISOString(),
    status: "Open",
    lines: [{ item: "item_1", qty: 10, rate: 50, receivedQty: 0 }],
    requisitionRef: reqId,
  });

  // Example GRN (none yet)
  return { message: "seeded", counts: { users: db.users.length, resorts: db.resorts.length, requisitions: db.requisitions.length } };
}

// Query functions
function getAssignedResortsForUser(userId) {
  const user = db.users.find(u => u._id === userId || u.username === userId);
  if (!user) return [];
  return db.resorts.filter(r => user.resorts.includes(r._id));
}

function createRequisition(payload, createdBy) {
  const newReq = {
    _id: id('req'),
    requisitionNo: `REQ-${Date.now()}`,
    resort: payload.resort,
    department: payload.department,
    createdBy: createdBy || 'anon',
    date: new Date().toISOString(),
    requiredBy: payload.requiredBy || null,
    status: payload.status || 'Submitted',
    lines: (payload.lines || []).map(l => ({ lineId: id('l'), item: l.item, qty: l.qty, remark: l.remark })),
  };
  db.requisitions.push(newReq);
  return newReq;
}

function listRequisitionsByResort(resortId) {
  return db.requisitions.filter(r => r.resort === resortId);
}

function approveRequisition(id, action, lines, approver) {
  const req = db.requisitions.find(r => r._id === id);
  if (!req) return null;
  if (action === 'approve') req.status = 'Approved';
  else if (action === 'partial') req.status = 'Partially Approved';
  else if (action === 'reject') req.status = 'Rejected';
  req.approvedBy = approver || null;
  req.approvedAt = new Date().toISOString();
  // naive: don't change lines here in detail
  return req;
}

function createPO(payload, createdBy) {
  const newPo = {
    _id: id('po'),
    poNo: `PO-${Date.now()}`,
    resort: payload.resort,
    vendor: payload.vendor,
    date: new Date().toISOString(),
    status: 'Open',
    lines: payload.items || [],
    requisitionRef: payload.requisitionRef || null,
  };
  db.po.push(newPo);
  return newPo;
}

function createGRN(payload, createdBy) {
  const newGrn = {
    _id: id('grn'),
    grnNo: `GRN-${Date.now()}`,
    resort: payload.resort,
    store: payload.store,
    vendor: payload.vendor,
    date: new Date().toISOString(),
    status: 'Pending QC',
    lines: payload.items || [],
    poRef: payload.po || null,
  };
  db.grn.push(newGrn);
  // update stock (naive)
  newGrn.lines.forEach(line => {
    const item = db.items.find(it => it._id === line.item || it._id === line.item || it.item === line.item);
    if (item) {
      item.stockByStore = item.stockByStore || {};
      const s = line.store || payload.store || 'store_1';
      item.stockByStore[s] = (item.stockByStore[s] || 0) + (line.receivedQty || line.qty || 0);
    }
  });
  return newGrn;
}

module.exports = {
  db,
  seed,
  getAssignedResortsForUser,
  createRequisition,
  listRequisitionsByResort,
  approveRequisition,
  createPO,
  createGRN,
};
