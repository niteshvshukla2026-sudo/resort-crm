// backend/server_router.cjs
// 🔥 FINAL CLEAN ROUTER (SRC STRUCTURE COMPATIBLE)
// Server ONLY reads this file

const express = require("express");

function createRouter({ mongoose, useMongo }) {
  const router = express.Router();

  // ===============================
  // 🌱 LOAD MODELS (ONCE)
  // ===============================
  if (useMongo && mongoose) {
    // 🔥 FIXED PATH (src/models)
    require("./src/models")();
  }

  // ===============================
  // 🔐 DEMO USER / AUTH INJECT
  // ===============================
  router.use((req, res, next) => {
    const demo = req.header("x-demo-user");
    if (demo) {
      try {
        req.user = JSON.parse(demo);
      } catch (e) {
        req.user = {
          id: demo,
          role: "SUPER_ADMIN",
        };
      }
    }
    next();
  });

  // ===============================
  // 🔐 AUTH
  // ===============================
  router.use("/api/auth", require("./src/routes/auth.routes"));

  // ===============================
  // 🏨 MASTER DATA
  // ===============================
  router.use("/api/resorts", require("./src/routes/resort.routes"));
  router.use("/api/departments", require("./src/routes/department.routes"));
  router.use("/api/stores", require("./src/routes/store.routes"));
  router.use("/api/item-categories", require("./src/routes/itemCategory.routes"));
  router.use("/api/items", require("./src/routes/item.routes"));
  router.use("/api/recipes", require("./src/routes/recipe.routes"));

  // ===============================
  // 👥 USERS & ROLES
  // ===============================
  router.use("/api/users", require("./src/routes/user.routes"));
  router.use("/api/roles", require("./src/routes/role.routes"));

  // ===============================
  // 🧾 PROCUREMENT FLOW
  // ===============================
  router.use("/api/vendors", require("./src/routes/vendor.routes"));
  router.use("/api/requisitions", require("./src/routes/requisition.routes"));
  router.use("/api/po", require("./src/routes/po.routes"));
  router.use("/api/grn", require("./src/routes/grn.routes"));

  // ===============================
  // 🔁 STORE REPLACEMENT
  // ===============================
  router.use(
    "/api/store-replacements",
    require("./src/routes/storeReplacement.routes")
  );

  // ===============================
  // 🍽️ CONSUMPTION
  // ===============================
  router.use("/api/consumption", require("./src/routes/consumption.routes"));

  // ===============================
  // 📦 INVENTORY
  // ===============================
  router.use("/api/inventory", require("./src/routes/inventory.routes"));

  // ===============================
  // 📊 DASHBOARD
  // ===============================
  router.use("/api/dashboard", require("./src/routes/dashboard.routes"));

  // ===============================
  // ❌ FALLBACK (UNKNOWN ROUTES)
  // ===============================
  router.use((req, res) => {
    res.status(404).json({
      message: "API route not found",
      path: req.originalUrl,
    });
  });

  return router;
}

module.exports = { createRouter };
