const express = require("express");
const router = express.Router();

const {
  listPO,
  createPO,
  updatePO,
  deletePO,
} = require("../controllers/po.controller");

// ===============================
// PURCHASE ORDERS (PO)
// ===============================

// LIST
router.get("/api/po", listPO);

// CREATE (direct OR from requisition)
router.post("/api/po", createPO);

// UPDATE
router.put("/api/po/:id", updatePO);

// DELETE
router.delete("/api/po/:id", deletePO);

module.exports = router;
