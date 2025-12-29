const {
  listResorts,
  createResort,
  updateResort,
  deleteResort,
} = require("../controllers/resort.controller");

const { protect } = require("../middlewares/auth.middleware");

module.exports = (router) => {
  // 🔥 Resorts
  router.get("/api/resorts", protect, listResorts);
  router.post("/api/resorts", protect, createResort);
  router.put("/api/resorts/:id", protect, updateResort);
  router.delete("/api/resorts/:id", protect, deleteResort);
};
