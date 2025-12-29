module.exports = function (router) {
  const mongoose = require("mongoose");
  const controller = require("../controllers/auth.controller.js")(mongoose);

  router.post("/api/auth/login", controller.login);
//   router.get("/api/auth/force-reset", controller.forceResetPassword);
};
