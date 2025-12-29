const {
  createUser,
  listUsers,
  updateUser,
  deleteUser,
} = require("../controllers/user.controller");

module.exports = (router) => {
  // USERS
  router.post("/api/users", createUser);
  router.get("/api/users", listUsers);
  router.put("/api/users/:id", updateUser);
  router.delete("/api/users/:id", deleteUser);
};
