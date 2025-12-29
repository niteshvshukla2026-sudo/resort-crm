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
  // 📦 CONTROLLERS
  // ==================================================
  const authCtrl = require("./src/controllers/auth.controller");
  const userCtrl = require("./src/controllers/user.controller");
  const roleCtrl = require("./src/controllers/role.controller");

  const storeCtrl = require("./src/controllers/store.controller");
  const itemCtrl = require("./src/controllers/item.controller");
  const vendorCtrl = require("./src/controllers/vendor.controller");

  const requisitionCtrl = require("./src/controllers/requisition.controller");
  const poCtrl = require("./src/controllers/po.controller");
  const grnCtrl = require("./src/controllers/grn.controller");

  const storeReplacementCtrl =
    require("./src/controllers/storeReplacement.controller");
  const consumptionCtrl =
    require("./src/controllers/consumption.controller");

  // 🔥 MISSING APIs (NOW ADDED)
  const departmentCtrl =
    require("./src/controllers/department.controller");
  const resortCtrl =
    require("./src/controllers/resort.controller");
  const recipeCtrl =
    require("./src/controllers/recipe.controller");
  const itemCategoryCtrl =
    require("./src/controllers/itemCategory.controller");

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
  // 📦 ITEM CATEGORIES
  // ==================================================
  router.get("/api/item-categories", protect,
    requirePermission("ITEMS", "READ"),
    safe(itemCategoryCtrl.list)
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
  router.get("/api/requisitions/:id", protect,
    requirePermission("REQUISITIONS", "READ"),
    safe(requisitionCtrl.getOne)
  );
  router.post("/api/requisitions", protect,
    requirePermission("REQUISITIONS", "CREATE"),
    safe(requisitionCtrl.create)
  );
  router.put("/api/requisitions/:id", protect,
    requirePermission("REQUISITIONS", "UPDATE"),
    safe(requisitionCtrl.update)
  );
  router.delete("/api/requisitions/:id", protect,
    requirePermission("REQUISITIONS", "DELETE"),
    safe(requisitionCtrl.remove)
  );
  router.post("/api/requisitions/:id/approve", protect,
    requirePermission("REQUISITIONS", "APPROVE"),
    safe(requisitionCtrl.approve)
  );
  router.post("/api/requisitions/:id/reject", protect,
    requirePermission("REQUISITIONS", "APPROVE"),
    safe(requisitionCtrl.reject)
  );

  // ==================================================
  // 🛒 PO
  // ==================================================
  router.get("/api/po", protect,
    requirePermission("PO", "READ"),
    safe(poCtrl.list)
  );
  router.post("/api/po", protect,
    requirePermission("PO", "CREATE"),
    safe(poCtrl.create)
  );
  router.put("/api/po/:id", protect,
    requirePermission("PO", "UPDATE"),
    safe(poCtrl.update)
  );
  router.delete("/api/po/:id", protect,
    requirePermission("PO", "DELETE"),
    safe(poCtrl.remove)
  );

  // ==================================================
  // 📦 GRN
  // ==================================================
  router.get("/api/grn", protect,
    requirePermission("GRN", "READ"),
    safe(grnCtrl.list)
  );
  router.post("/api/grn", protect,
    requirePermission("GRN", "CREATE"),
    safe(grnCtrl.create)
  );
  router.post("/api/grn/:id/close", protect,
    requirePermission("GRN", "UPDATE"),
    safe(grnCtrl.closeAndAddStock)
  );
  router.delete("/api/grn/:id", protect,
    requirePermission("GRN", "DELETE"),
    safe(grnCtrl.remove)
  );

  // ==================================================
  // 🔄 STORE REPLACEMENT
  // ==================================================
  router.get("/api/store-replacements", protect,
    requirePermission("STORES", "READ"),
    safe(storeReplacementCtrl.list)
  );
  router.post("/api/store-replacements", protect,
    requirePermission("STORES", "CREATE"),
    safe(storeReplacementCtrl.create)
  );
  router.patch("/api/store-replacements/:id/issue-vendor", protect,
    requirePermission("STORES", "UPDATE"),
    safe(storeReplacementCtrl.issueToVendor)
  );
  router.post("/api/store-replacements/:id/create-grn", protect,
    requirePermission("GRN", "CREATE"),
    safe(storeReplacementCtrl.createGrnAndAddStock)
  );

  // ==================================================
  // 🍽️ CONSUMPTION
  // ==================================================
  router.get("/api/consumption", protect,
    requirePermission("REPORTS", "READ"),
    safe(consumptionCtrl.listConsumptions || consumptionCtrl.list)
  );
  router.post("/api/consumption", protect,
    requirePermission("REPORTS", "CREATE"),
    safe(consumptionCtrl.createConsumption || consumptionCtrl.create)
  );

  // ==================================================
  // ❤️ HEALTH
  // ==================================================
  router.get("/_health", (req, res) => res.json({ ok: true }));

  return router;
}

module.exports = { createRouter };
