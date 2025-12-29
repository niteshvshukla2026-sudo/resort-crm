const express = require("express");
const router = express.Router();

const {
  listRequisitions,
  getRequisition,
  createRequisition,
  updateRequisition,
  deleteRequisition,
  approveRequisition,
  holdRequisition,
  rejectRequisition,
} = require("../controllers/requisition.controller");

// ===============================
// REQUISITIONS
// ===============================

// LIST (with resort filter)
router.get("/api/requisitions", listRequisitions);

// GET SINGLE
router.get("/api/requisitions/:id", getRequisition);

// CREATE
router.post("/api/requisitions", createRequisition);

// UPDATE
router.put("/api/requisitions/:id", updateRequisition);

// DELETE
router.delete("/api/requisitions/:id", deleteRequisition);

// ACTIONS
router.post("/api/requisitions/:id/approve", approveRequisition);
router.post("/api/requisitions/:id/hold", holdRequisition);
router.post("/api/requisitions/:id/reject", rejectRequisition);

module.exports = router;
