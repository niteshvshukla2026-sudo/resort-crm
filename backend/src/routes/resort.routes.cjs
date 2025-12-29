const express = require("express");
const router = express.Router();

const {
  listResorts,
  createResort,
  updateResort,
  deleteResort,
} = require("../controllers/resort.controller");

const { protect } = require("../middlewares/auth.middleware");

// 🔥 LIST RESORTS
router.get("/resorts", protect, listResorts);

// 🔥 CREATE RESORT
router.post("/resorts", protect, createResort);

// 🔥 UPDATE RESORT
router.put("/resorts/:id", protect, updateResort);

// 🔥 DELETE RESORT
router.delete("/resorts/:id", protect, deleteResort);

module.exports = router;
