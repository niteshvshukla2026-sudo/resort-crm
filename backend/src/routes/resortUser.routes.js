
import express from "express";
import { protect } from "../middleware/auth.js";

const router = express.Router();
router.use(protect);

const USE_INMEM = process.env.USE_INMEMORY === "true";
let inmem;
if (USE_INMEM) {
  // CommonJS require since module is CommonJS
  inmem = require("../inmemoryDb.js");
  // auto-seed if needed
  if (typeof inmem.seed === "function") {
    inmem.seed();
  }
}

// Get resorts assigned to current user
router.get("/assigned-resorts", async (req, res) => {
  if (USE_INMEM) {
    const resorts = inmem.getAssignedResortsForUser(req.user?.username || req.user?._id || "user_1");
    return res.json({ userId: req.user?._id, resorts });
  }
  // fallback stub
  res.json({ userId: req.user?.id || "anon", resorts: [{ _id: "resort_1", name: "Beachside Resort" }] });
});

// Create requisition
router.post("/requisitions", async (req, res) => {
  if (USE_INMEM) {
    const r = inmem.createRequisition(req.body, req.user?.username || req.user?._id);
    return res.status(201).json({ message: "Requisition created (in-memory)", requisition: r });
  }
  res.status(201).json({ message: "Requisition created (stub)", requisition: Object.assign({}, req.body, { requisitionNo: `REQ-${Date.now()}` }) });
});

// List requisitions for a resort
router.get("/requisitions/:resortId", async (req, res) => {
  if (USE_INMEM) {
    const list = inmem.listRequisitionsByResort(req.params.resortId);
    return res.json(list);
  }
  res.json([]);
});

// Approve / reject requisition line-wise
router.post("/requisitions/:id/approve", async (req, res) => {
  if (USE_INMEM) {
    const { action, lines, reason } = req.body;
    const r = inmem.approveRequisition(req.params.id, action, lines, req.user?.username || req.user?._id);
    return res.json({ message: "Requisition approval (in-memory)", r });
  }
  const { action, lines, reason } = req.body;
  res.json({ message: "Requisition approval (stub)", id: req.params.id, action, lines, reason });
});

// Create PO from approved requisitions
router.post("/po", async (req, res) => {
  if (USE_INMEM) {
    const po = inmem.createPO(req.body, req.user?.username || req.user?._id);
    return res.status(201).json({ message: "PO created (in-memory)", po });
  }
  const po = Object.assign({}, req.body, { poNo: `PO-${Date.now()}`, status: "Open" });
  res.status(201).json({ message: "PO created (stub)", po });
});

// Create GRN (Goods Receipt Note)
router.post("/grn", async (req, res) => {
  if (USE_INMEM) {
    const grn = inmem.createGRN(req.body, req.user?.username || req.user?._id);
    return res.status(201).json({ message: "GRN created (in-memory)", grn });
  }
  const grn = Object.assign({}, req.body, { grnNo: `GRN-${Date.now()}`, status: "Pending QC" });
  res.status(201).json({ message: "GRN created (stub)", grn });
});

// Reports endpoints (stubs / in-memory)

// Dashboard stats (counts) for a resort
router.get("/dashboard-stats/:resortId", async (req, res) => {
  const resortId = req.params.resortId;
  if (process.env.USE_INMEMORY === "true") {
    try {
      const inmem = await import("../inmemoryDb.js");
      const db = inmem.db;
      const totalResorts = db.resorts.length;
      const openRequisitions = db.requisitions.filter(r => r.resort === resortId && r.status === "Submitted").length;
      const pendingGRN = db.grn.filter(g => g.resort === resortId && g.status === "Pending QC").length;
      const lowStockItems = db.items.filter(it => {
        // naive: stock by first store less than 20 => low
        const stores = Object.keys(it.stockByStore || {});
        if (stores.length === 0) return false;
        const qty = it.stockByStore[stores[0]] || 0;
        return qty < 20;
      }).length;
      return res.json({ totalResorts, openRequisitions, pendingGRN, lowStockItems });
    } catch (e) {
      console.warn("dashboard-stats import failed", e);
    }
  }
  // fallback stub
  res.json({ totalResorts: 1, openRequisitions: 0, pendingGRN: 0, lowStockItems: 0 });
});
router.get("/reports/requisitions", async (req, res) => {
  if (USE_INMEM) {
    // return a simple summary
    return res.json({ totalRequisitions: inmem.db.requisitions.length, requisitions: inmem.db.requisitions });
  }
  res.json({ report: "Requisition Register (stub)" });
});

router.get("/reports/po-register", async (req, res) => {
  if (USE_INMEM) {
    return res.json({ totalPOs: inmem.db.po.length, po: inmem.db.po });
  }
  res.json({ report: "PO Register (stub)" });
});

export default router;
