const permit = require("../middlewares/permit.cjs");

module.exports = (router) => {
  const ctrl = require("../controllers/consumption.controller.cjs");

  router.get(
    "/api/consumption",
    permit("CONSUMPTION", "READ"),
    ctrl.list
  );

  router.get(
    "/api/consumption/:id",
    permit("CONSUMPTION", "READ"),
    ctrl.getOne
  );

  router.post(
    "/api/consumption",
    permit("CONSUMPTION", "CREATE"),
    ctrl.create
  );

  router.put(
    "/api/consumption/:id",
    permit("CONSUMPTION", "UPDATE"),
    ctrl.update
  );

  router.delete(
    "/api/consumption/:id",
    permit("CONSUMPTION", "DELETE"),
    ctrl.remove
  );
};
