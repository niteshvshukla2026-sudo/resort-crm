const ctrl = require("../controllers/resort.controller");

module.exports = (router) => {
  router.get("/api/resorts", ctrl.listResorts);
  router.post("/api/resorts", ctrl.createResort);
  router.put("/api/resorts/:id", ctrl.updateResort);
  router.delete("/api/resorts/:id", ctrl.deleteResort);
};
