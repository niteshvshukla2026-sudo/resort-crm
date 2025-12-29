const {
  list,
  create,
  update,
  remove,
} = require("../controllers/store.controller");

const { protect } = require("../middlewares/auth.middleware");

module.exports = (router) => {
  router.get("/api/stores", protect, list);
  router.post("/api/stores", protect, create);
  router.put("/api/stores/:id", protect, update);
  router.delete("/api/stores/:id", protect, remove);
};
