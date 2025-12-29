const express = require("express");
const router = express.Router();

const {
  listGRN,
  createGRN,
  closeGRN,
  deleteGRN,
} = require("../controllers/grn.controller");

// LIST
router.get("/api/grn", listGRN);

// CREATE (from requisition or PO)
router.post("/api/grn", createGRN);

// 🔒 CLOSE GRN → ADD STOCK
router.post("/api/grn/:id/close", closeGRN);

// DELETE
router.delete("/api/grn/:id", deleteGRN);

module.exports = router;
