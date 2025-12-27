// backend/server_router.cjs
// 🔥 FINAL CLEAN ROUTER — ONLY ROUTES LOADER
// Server will ONLY read this file

const express = require("express");

function createRouter({ mongoose, useMongo }) {
  const router = express.Router();

  // ===============================
  // 🌱 LOAD MODELS (ONCE)
  // ===============================
  if (useMongo && mongoose) {
    require("./models"); // index.js loads ALL models
  }

  // ===============================
  // 🔐 DEMO / AUTH USER INJECT
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
  router.use("/api/auth", require("./routes/auth.routes"));

  // ===============================
  // 🏨 MASTER DATA
  // ===============================
  router.use("/api/resorts", require("./routes/resort.routes"));
  router.use("/api/departments", require("./routes/department.routes"));
  router.use("/api/stores", require("./routes/store.routes"));
  router.use("/api/item-categories", require("./routes/itemCategory.routes"));
  router.use("/api/items", require("./routes/item.routes"));
  router.use("/api/recipes", require("./routes/recipe.routes"));

  // ===============================
  // 👥 USERS & ROLES
  // ===============================
  router.use("/api/users", require("./routes/user.routes"));
  router.use("/api/roles", require("./routes/role.routes"));

  // ===============================
  // 🧾 PROCUREMENT FLOW
  // ===============================
  router.use("/api/vendors", require("./routes/vendor.routes"));
  router.use("/api/requisitions", require("./routes/requisition.routes"));
  router.use("/api/po", require("./routes/po.routes"));
  router.use("/api/grn", require("./routes/grn.routes"));

  // ===============================
  // 🔁 STORE REPLACEMENT
  // ===============================
  router.use(
    "/api/store-replacements",
    require("./routes/storeReplacement.routes")
  );

  // ===============================
  // 🍽️ CONSUMPTION
  // ===============================
  router.use("/api/consumption", require("./routes/consumption.routes"));

  // ===============================
  // 📦 INVENTORY
  // ===============================
  router.use("/api/inventory", require("./routes/inventory.routes"));

  // ===============================
  // 📊 DASHBOARD
  // ===============================
  router.use("/api/dashboard", require("./routes/dashboard.routes"));

  // ===============================
  // ❌ FALLBACK
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
