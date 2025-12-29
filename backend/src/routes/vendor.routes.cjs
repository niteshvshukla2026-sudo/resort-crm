const ctrl = require("../controllers/vendor.controller");

module.exports = (router) => {
  router.get("/api/vendors", ctrl.listVendors);
  router.post("/api/vendors", ctrl.createVendor);
  router.put("/api/vendors/:id", ctrl.updateVendor);
  router.delete("/api/vendors/:id", ctrl.deleteVendor);
};
