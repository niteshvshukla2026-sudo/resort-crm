// backend/server_router.cjs
// ==================================================
// 🔥 FULL FINAL CONSOLIDATED ROUTER (PRODUCTION READY)
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
  // 🔥 LOAD ALL MODELS
  // ==================================================
  if (useMongo && mongoose) {
    require("./src/models/index.cjs");
  }

  // ==================================================
  // 🔐 AUTH MIDDLEWARE
  // ==================================================
  const { protect, requirePermission } =
    require("./src/middlewares/auth.middleware");

  // ==================================================
  // 📦 CONTROLLERS (✅ EXACT FILENAMES)
  // ==================================================
  const authCtrl = require("./src/controllers/auth.controller.js");
  const userCtrl = require("./src/controllers/user.controller.js");
  const roleCtrl = require("./src/controllers/role.controller.js");

  const storeCtrl = require("./src/controllers/store.controller.js");
  const itemCtrl = require("./src/controllers/item.controller.js");
  const vendorCtrl = require("./src/controllers/vendor.controller.js");

  const requisitionCtrl = require("./src/controllers/requisition.controller.js");
  const poCtrl = require("./src/controllers/po.controller.js");
  const grnCtrl = require("./src/controllers/grn.controller.js");

  const storeReplacementCtrl =
    require("./src/controllers/storeReplacement.controller.js");
  const consumptionCtrl =
    require("./src/controllers/consumption.controller.js");

  const departmentCtrl =
    require("./src/controllers/department.controller.js");
  const resortCtrl =
    require("./src/controllers/resort.controller.js");
  const recipeCtrl =
    require("./src/controllers/recipe.controller.js");


  // ==================================================
  // 🔐 AUTH
  // ==================================================
  router.post("/api/auth/login", safe(authCtrl.login));
  router.get("/api/auth/me", protect, safe(authCtrl.me));
  router.get("/api/auth/force-reset", safe(authCtrl.forceResetPassword));

  // ==================================================
  // 👤 USERS
  // ==================================================
  router.get("/api/users", protect,
    requirePermission("USERS", "READ"),
    safe(userCtrl.listUsers || userCtrl.list)
  );
  router.post("/api/users", protect,
    requirePermission("USERS", "CREATE"),
    safe(userCtrl.createUser || userCtrl.create)
  );
  router.put("/api/users/:id", protect,
    requirePermission("USERS", "UPDATE"),
    safe(userCtrl.updateUser || userCtrl.update)
  );
  router.delete("/api/users/:id", protect,
    requirePermission("USERS", "DELETE"),
    safe(userCtrl.deleteUser || userCtrl.remove)
  );

  // ==================================================
  // 🧑‍⚖️ ROLES
  // ==================================================
  router.get("/api/roles", protect,
    requirePermission("ROLES", "READ"),
    safe(roleCtrl.list)
  );
  router.post("/api/roles", protect,
    requirePermission("ROLES", "CREATE"),
    safe(roleCtrl.create)
  );
  router.put("/api/roles/:id", protect,
    requirePermission("ROLES", "UPDATE"),
    safe(roleCtrl.update)
  );

  // ==================================================
  // 🏖️ RESORTS
  // ==================================================
  router.get("/api/resorts", protect,
    requirePermission("RESORTS", "READ"),
    safe(resortCtrl.list)
  );

  // ==================================================
  // 🏢 DEPARTMENTS
  // ==================================================
  router.get("/api/departments", protect,
    requirePermission("DEPARTMENTS", "READ"),
    safe(departmentCtrl.list)
  );

  // ==================================================
  // 🏬 STORES
  // ==================================================
  router.get("/api/stores", protect,
    requirePermission("STORES", "READ"),
    safe(storeCtrl.list)
  );
  router.post("/api/stores", protect,
    requirePermission("STORES", "CREATE"),
    safe(storeCtrl.create)
  );
  router.put("/api/stores/:id", protect,
    requirePermission("STORES", "UPDATE"),
    safe(storeCtrl.update)
  );
  router.delete("/api/stores/:id", protect,
    requirePermission("STORES", "DELETE"),
    safe(storeCtrl.remove)
  );


  // ==================================================
  // 📦 ITEMS
  // ==================================================
  router.get("/api/items", protect,
    requirePermission("ITEMS", "READ"),
    safe(itemCtrl.list)
  );
  router.post("/api/items", protect,
    requirePermission("ITEMS", "CREATE"),
    safe(itemCtrl.create)
  );

  // ==================================================
  // 🚚 VENDORS
  // ==================================================
  router.get("/api/vendors", protect,
    requirePermission("VENDORS", "READ"),
    safe(vendorCtrl.list)
  );
  router.post("/api/vendors", protect,
    requirePermission("VENDORS", "CREATE"),
    safe(vendorCtrl.create)
  );

  // ==================================================
  // 🍳 RECIPES
  // ==================================================
  router.get("/api/recipes", protect,
    requirePermission("RECIPES", "READ"),
    safe(recipeCtrl.list)
  );

  // ==================================================
  // 🧾 REQUISITIONS
  // ==================================================
  router.get("/api/requisitions", protect,
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
