const {
  login,
  forceResetPassword,
} = require("../src/controllers/auth.controller.cjs");

module.exports = (router) => {
  router.post("/api/auth/login", login);
  router.get("/api/auth/force-reset", forceResetPassword);
};
