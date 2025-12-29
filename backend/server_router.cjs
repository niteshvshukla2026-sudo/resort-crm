// backend/server_router.cjs
// ==================================================
// 🔥 FINAL CONSOLIDATED ROUTER (STABLE & PRODUCTION SAFE)
// ==================================================

const express = require("express");

// 🔒 SAFE HANDLER — undefined callbacks won’t crash server
const safe = (fn) => {
  if (typeof fn !== "function") {
    return (req, res) =>
      res.status(500).json({ message: "Route handler not implemented" });
  }
  return fn;
};

function createRouter({ useMongo, mongoose }) {
  const router = express.Router();

  // ==================================================
  // 🔥 LOAD ALL MODELS (REGISTER SCHEMAS)
  // ==================================================
  if (useMongo && mongoose) {
    require("./src/models/index.cjs");
  }

  // ==================================================
  // 🔐 AUTH MIDDLEWARE
  // ==================================================
  const {
    protect,
    requirePermission,
  } = require("./src/middlewares/auth.middleware");

  // ==================================================
  // 📦 CONTROLLERS
  // ==================================================
  const authCtrl = require("./src/controllers/auth.controller");
  const userCtrl = require("./src/controllers/user.controller");
  const roleCtrl = require("./src/controllers/role.controller");

  const resortCtrl = require("./src/controllers/resort.controller");
  const departmentCtrl = require("./src/controllers/department.controller");
  const storeCtrl = require("./src/controllers/store.controller");
  const vendorCtrl = require("./src/controllers/vendor.controller");
  const recipeCtrl = require("./src/controllers/recipe.controller");

  const requisitionCtrl = require("./src/controllers/requisition.controller");
  const poCtrl = require("./src/controllers/po.controller");
  const grnCtrl = require("./src/controllers/grn.controller");

  const storeReplacementCtrl = require(
    "./src/controllers/storeReplacement.controller"
  );
  const consumptionCtrl = require(
    "./src/controllers/consumption.controller"
  );

  // ==================================================
  // 🔐 AUTH
  // ==================================================
  router.post("/api/auth/login", safe(authCtrl.login));

  // ==================================================
  // 🏖️ RESORTS
  // ==================================================
  router.get(
    "/api/resorts",
    protect,
    requirePermission("RESORTS", "READ"),
    safe(resortCtrl.listResorts)
  );

  router.post(
    "/api/resorts",
    protect,
    requirePermission("RESORTS", "CREATE"),
    safe(resortCtrl.createResort)
  );

  router.put(
    "/api/resorts/:id",
    protect,
    requirePermission("RESORTS", "UPDATE"),
    safe(resortCtrl.updateResort)
  );

  router.delete(
    "/api/resorts/:id",
    protect,
    requirePermission("RESORTS", "DELETE"),
    safe(resortCtrl.deleteResort)
  );

  // ==================================================
  // 🏢 DEPARTMENTS
  // ==================================================
  router.get(
    "/api/departments",
    protect,
    requirePermission("DEPARTMENTS", "READ"),
    safe(departmentCtrl.listDepartments)
  );

  router.post(
    "/api/departments",
    protect,
    requirePermission("DEPARTMENTS", "CREATE"),
    safe(departmentCtrl.createDepartment)
  );

  router.put(
    "/api/departments/:id",
    protect,
    requirePermission("DEPARTMENTS", "UPDATE"),
    safe(departmentCtrl.updateDepartment)
  );

  router.delete(
    "/api/departments/:id",
    protect,
    requirePermission("DEPARTMENTS", "DELETE"),
    safe(departmentCtrl.deleteDepartment)
  );

  // ==================================================
  // 🏬 STORES
  // ==================================================
  router.get(
    "/api/stores",
    protect,
    requirePermission("STORES", "READ"),
    safe(storeCtrl.list)
  );

  router.post(
    "/api/stores",
    protect,
    requirePermission("STORES", "CREATE"),
    safe(storeCtrl.create)
  );

  router.put(
    "/api/stores/:id",
    protect,
    requirePermission("STORES", "UPDATE"),
    safe(storeCtrl.update)
  );

  router.delete(
    "/api/stores/:id",
    protect,
    requirePermission("STORES", "DELETE"),
    safe(storeCtrl.remove)
  );

  // ==================================================
  // 🚚 VENDORS
  // ==================================================
  router.get(
    "/api/vendors",
    protect,
    requirePermission("VENDORS", "READ"),
    safe(vendorCtrl.list)
  );

  router.post(
    "/api/vendors",
    protect,
    requirePermission("VENDORS", "CREATE"),
    safe(vendorCtrl.create)
  );

  // ==================================================
  // 🍳 RECIPES
  // ==================================================
  router.get(
    "/api/recipes",
    protect,
    requirePermission("RECIPES", "READ"),
    safe(recipeCtrl.list)
  );

  // ==================================================
  // 🧾 REQUISITIONS
  // ==================================================
  router.get(
    "/api/requisitions",
    protect,
    requirePermission("REQUISITIONS", "READ"),
    safe(requisitionCtrl.list)
  );

  // ==================================================
  // ❤️ HEALTH
  // ==================================================
  router.get("/_health", (req, res) => res.json({ ok: true }));

  return router;
}

module.exports = { createRouter };
