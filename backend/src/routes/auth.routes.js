module.exports = (router) => {
  const { login, forceResetPassword } =
    require("../src/controllers/auth.controller.cjs");

  router.post("/api/auth/login", login);
  router.get("/api/auth/force-reset", forceResetPassword);
};