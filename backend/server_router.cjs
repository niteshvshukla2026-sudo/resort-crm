// backend/server_router.cjs

const express = require("express");
const { createControllers } = require("./controllers.cjs");

function createRouter({ useMongo, mongoose }) {
  const router = express.Router();
  const controllers = createControllers({ useMongo, mongoose });

  // Demo-auth header (optional)
  router.use((req, res, next) => {
    const demo = req.header("x-demo-user");
    if (demo) {
      try {
        req.user = JSON.parse(demo);
      } catch (e) {
        req.user = {
          id: demo,
          name: "Demo User",
          role: "RESORT_USER",
          resorts: [],
        };
      }
    }
    next();
  });

  // ------------------------
  // 🔐 AUTH
  // ------------------------
  router.post("/api/auth/login", controllers.login);

  // ------------------------
  // 📊 Dashboard
  // ------------------------
  router.get(
    "/dashboard/resort/:resortId/kpi",
    controllers.getResortKpi
  );

  // ------------------------
  // 🏨 RESORTS (full CRUD)
  // ------------------------
  // old path (if something was using it)
  router.get("/resorts", controllers.listResorts);

  // new REST API used by UI
  router.get("/api/resorts", controllers.listResorts);
  router.post("/api/resorts", controllers.createResort);
  router.put("/api/resorts/:id", controllers.updateResort);
  router.delete("/api/resorts/:id", controllers.deleteResort);

  // ------------------------
  // 🏬 DEPARTMENTS (full CRUD)
  // ------------------------
  router.get("/departments", controllers.listDepartments);

  router.get("/api/departments", controllers.listDepartments);
  router.post("/api/departments", controllers.createDepartment);
  router.put("/api/departments/:id", controllers.updateDepartment);
  router.delete(
    "/api/departments/:id",
    controllers.deleteDepartment
  );

  // ------------------------
  // 📦 REQUISITIONS (demo)
  // ------------------------
  router.get("/requisitions", controllers.listRequisitions);
  router.post("/requisitions", controllers.createRequisition);

  // ------------------------
  // 📑 PURCHASE ORDERS (demo)
  // ------------------------
  router.get("/po", controllers.listPOs);

  // ------------------------
  // 📦 ITEMS (demo)
  // ------------------------
  router.get("/items", controllers.listItems);

  // ------------------------
  // 👥 ROLES / USERS (demo)
  // ------------------------
  router.get("/roles", controllers.listRoles);
  router.get("/users", controllers.listUsers);

  return router;
}

module.exports = { createRouter };
