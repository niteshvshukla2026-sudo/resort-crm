const { login } = require("../controllers/auth.controller");

module.exports = (router) => {
  router.post("/api/auth/login", login);
};
