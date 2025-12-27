// backend/server_router.cjs
// 🔥 FINAL CJS ROUTER (NO ESM ANYWHERE)

const express = require("express");

function createRouter({ mongoose, useMongo }) {
  const router = express.Router();

  // ===============================
  // 🌱 LOAD MODELS (ONCE)
  // ===============================
  if (useMongo && mongoose) {
    require("./src/models")(); // ✅ CJS CALL
  }

  // ===============================
  // 🔐 DEMO USER INJECT
  // ===============================
  router.use((req, res, next) => {
    const demo = req.header("x-demo-user");
    if (demo) {
      try {
        req.user = JSON.parse(demo);
      } catch {
        req.user = { id: demo, role: "SUPER_ADMIN" };
      }
    }
    next();
  });

  // ===============================
  // ROUTES
  // ===============================
  router.use("/api/auth", require("./src/routes/auth.routes"));

  router.use("/api/resorts", require("./src/routes/resort.routes"));
  router.use("/api/departments", require("./src/routes/department.routes"));
  router.use("/api/stores", require("./src/routes/store.routes"));
  router.use("/api/item-categories", require("./src/routes/itemCategory.routes"));
  router.use("/api/items", require("./src/routes/item.routes"));
  router.use("/api/recipes", require("./src/routes/recipe.routes"));

  router.use("/api/users", require("./src/routes/user.routes"));
  router.use("/api/roles", require("./src/routes/role.routes"));

  router.use("/api/vendors", require("./src/routes/vendor.routes"));
  router.use("/api/requisitions", require("./src/routes/requisition.routes"));
  router.use("/api/po", require("./src/routes/po.routes"));
  router.use("/api/grn", require("./src/routes/grn.routes"));

  router.use(
    "/api/store-replacements",
    require("./src/routes/storeReplacement.routes")
  );

  router.use("/api/consumption", require("./src/routes/consumption.routes"));
  router.use("/api/inventory", require("./src/routes/inventory.routes"));
  router.use("/api/dashboard", require("./src/routes/dashboard.routes"));

  // ===============================
  // FALLBACK
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
