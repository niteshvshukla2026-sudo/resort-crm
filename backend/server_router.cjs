// backend/server_router.cjs
// ==================================================
// 🔥 FINAL CONSOLIDATED ROUTER (SAFE & CRASH-PROOF)
// ==================================================

const express = require("express");

/**
 * createRouter
 * @param {Object} opts
 * @param {boolean} opts.useMongo
 * @param {import("mongoose")} opts.mongoose
 */
function createRouter({ useMongo, mongoose }) {
  const router = express.Router();

  // ==================================================
  // 🔥 LOAD ALL MODELS
  // ==================================================
  if (useMongo && mongoose) {
    require("./src/models/index.cjs");
  }

  // ==================================================
  // 🔐 AUTH & PERMISSION MIDDLEWARE
  // ==================================================
  const authMw = require("./src/middlewares/auth.middleware");
  const protect = authMw.protect;
  const requirePermission = authMw.requirePermission;

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
  const storeReplacementCtrl = require("./src/controllers/storeReplacement.controller");
  const consumptionCtrl = require("./src/controllers/consumption.controller");

  // ==================================================
  // 🔐 AUTH
  // ==================================================
  router.post("/api/auth/login", authCtrl.login);
  router.get("/api/auth/me", protect, authCtrl.me);

  // ==================================================
  // 👤 USERS
  // ==================================================
  router.get(
    "/api/users",
    protect,
    requirePermission("USERS", "READ"),
    userCtrl.listUsers || userCtrl.list
  );

  router.post(
    "/api/users",
    protect,
    requirePermission("USERS", "CREATE"),
    userCtrl.createUser || userCtrl.create
  );

  router.put(
    "/api/users/:id",
    protect,
    requirePermission("USERS", "UPDATE"),
    userCtrl.updateUser || userCtrl.update
  );

  router.delete(
    "/api/users/:id",
    protect,
    requirePermission("USERS", "DELETE"),
    userCtrl.deleteUser || userCtrl.remove
  );

  // ==================================================
  // 🧑‍⚖️ ROLES
  // ==================================================
  router.get(
    "/api/roles",
    protect,
    requirePermission("ROLES", "READ"),
    roleCtrl.list
  );
  router.post(
    "/api/roles",
    protect,
    requirePermission("ROLES", "CREATE"),
    roleCtrl.create
  );
  router.put(
    "/api/roles/:id",
    protect,
    requirePermission("ROLES", "UPDATE"),
    roleCtrl.update
  );

  // ==================================================
  // 🏬 STORES
  // ==================================================
  router.get(
    "/api/stores",
    protect,
    requirePermission("STORES", "READ"),
    storeCtrl.list
  );
  router.post(
    "/api/stores",
    protect,
    requirePermission("STORES", "CREATE"),
    storeCtrl.create
  );
  router.put(
    "/api/stores/:id",
    protect,
    requirePermission("STORES", "UPDATE"),
    storeCtrl.update
  );
  router.delete(
    "/api/stores/:id",
    protect,
    requirePermission("STORES", "DELETE"),
    storeCtrl.remove
  );

  // ==================================================
  // 📦 ITEMS
  // ==================================================
  router.get(
    "/api/items",
    protect,
    requirePermission("ITEMS", "READ"),
    itemCtrl.list
  );
  router.post(
    "/api/items",
    protect,
    requirePermission("ITEMS", "CREATE"),
    itemCtrl.create
  );

  // ==================================================
  // 🚚 VENDORS
  // ==================================================
  router.get(
    "/api/vendors",
    protect,
    requirePermission("VENDORS", "READ"),
    vendorCtrl.list
  );
  router.post(
    "/api/vendors",
    protect,
    requirePermission("VENDORS", "CREATE"),
    vendorCtrl.create
  );

  // ==================================================
  // 🧾 REQUISITIONS
  // ==================================================
  router.get(
    "/api/requisitions",
    protect,
    requirePermission("REQUISITIONS", "READ"),
    requisitionCtrl.list
  );
  router.get(
    "/api/requisitions/:id",
    protect,
    requirePermission("REQUISITIONS", "READ"),
    requisitionCtrl.getOne
  );
  router.post(
    "/api/requisitions",
    protect,
    requirePermission("REQUISITIONS", "CREATE"),
    requisitionCtrl.create
  );
  router.put(
    "/api/requisitions/:id",
    protect,
    requirePermission("REQUISITIONS", "UPDATE"),
    requisitionCtrl.update
  );
  router.delete(
    "/api/requisitions/:id",
    protect,
    requirePermission("REQUISITIONS", "DELETE"),
    requisitionCtrl.remove
  );

  router.post(
    "/api/requisitions/:id/approve",
    protect,
    requirePermission("REQUISITIONS", "APPROVE"),
    requisitionCtrl.approve
  );
  router.post(
    "/api/requisitions/:id/reject",
    protect,
    requirePermission("REQUISITIONS", "APPROVE"),
    requisitionCtrl.reject
  );

  // ==================================================
  // 🛒 PO
  // ==================================================
  router.get(
    "/api/po",
    protect,
    requirePermission("PO", "READ"),
    poCtrl.list
  );
  router.post(
    "/api/po",
    protect,
    requirePermission("PO", "CREATE"),
    poCtrl.create
  );
  router.put(
    "/api/po/:id",
    protect,
    requirePermission("PO", "UPDATE"),
    poCtrl.update
  );
  router.delete(
    "/api/po/:id",
    protect,
    requirePermission("PO", "DELETE"),
    poCtrl.remove
  );

  // ==================================================
  // 📦 GRN
  // ==================================================
  router.get(
    "/api/grn",
    protect,
    requirePermission("GRN", "READ"),
    grnCtrl.list
  );
  router.post(
    "/api/grn",
    protect,
    requirePermission("GRN", "CREATE"),
    grnCtrl.create
  );
  router.post(
    "/api/grn/:id/close",
    protect,
    requirePermission("GRN", "UPDATE"),
    grnCtrl.closeAndAddStock
  );
  router.delete(
    "/api/grn/:id",
    protect,
    requirePermission("GRN", "DELETE"),
    grnCtrl.remove
  );

  // ==================================================
  // 🔄 STORE REPLACEMENT
  // ==================================================
  router.get(
    "/api/store-replacements",
    protect,
    requirePermission("STORES", "READ"),
    storeReplacementCtrl.list
  );
  router.post(
    "/api/store-replacements",
    protect,
    requirePermission("STORES", "CREATE"),
    storeReplacementCtrl.create
  );
  router.patch(
    "/api/store-replacements/:id/issue-vendor",
    protect,
    requirePermission("STORES", "UPDATE"),
    storeReplacementCtrl.issueToVendor
  );
  router.post(
    "/api/store-replacements/:id/create-grn",
    protect,
    requirePermission("GRN", "CREATE"),
    storeReplacementCtrl.createGrnAndAddStock
  );

  // ==================================================
  // 🍽️ CONSUMPTION
  // ==================================================
  router.get(
    "/api/consumption",
    protect,
    requirePermission("REPORTS", "READ"),
    consumptionCtrl.listConsumptions || consumptionCtrl.list
  );

  router.post(
    "/api/consumption",
    protect,
    requirePermission("REPORTS", "CREATE"),
    consumptionCtrl.createConsumption || consumptionCtrl.create
  );

  // ==================================================
  // ❤️ HEALTH
  // ==================================================
  router.get("/_health", (req, res) => res.json({ ok: true }));

  return router;
}

module.exports = { createRouter };
