const express = require("express");
const router = express.Router();

const {
  listConsumption,
  getConsumption,
  createConsumption,
  updateConsumption,
  deleteConsumption,
} = require("../controllers/consumption.controller");

// LIST
router.get("/api/consumption", listConsumption);

// GET SINGLE
router.get("/api/consumption/:id", getConsumption);

// CREATE
router.post("/api/consumption", createConsumption);

// UPDATE
router.put("/api/consumption/:id", updateConsumption);

// DELETE
router.delete("/api/consumption/:id", deleteConsumption);

module.exports = router;
