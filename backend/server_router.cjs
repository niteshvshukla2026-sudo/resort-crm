// backend/server_route.cjs
const express = require("express");

/**
 * 🔥 Central Router
 * - Loads models once
 * - Mounts all routes
 */
function createRouter({ mongoose, useMongo }) {
  const router = express.Router();

  // ================= LOAD MODELS =================
  if (useMongo) {
    require("./models/user.model.js");
    require("./models/role.model.js");
    require("./models/resort.model.js");
    require("./models/store.model.js");
    require("./models/item.model.js");
    require("./models/itemCategory.model.js");
    require("./models/vendor.model.js");
    require("./models/requisition.model.js");
    require("./models/po.model.js");
    require("./models/grn.model.js");
    require("./models/storeStock.model.js");
    require("./models/consumption.model.js");
    require("./models/recipe.model.js");
    require("./models/storeReplacement.model.js");
  }

  // ================= MIDDLEWARES =================
  const { protect } = require("./middlewares/auth.middleware.js");
  const {
    checkPermission,
  } = require("./middlewares/permission.middleware.js");

  // ================= AUTH =================
  router.use("/api/auth", require("./routes/auth.routes.cjs"));

  // ================= USERS & ROLES =================
  router.use("/api/users", protect, require("./routes/user.routes.cjs"));
  router.use("/api/roles", protect, require("./routes/role.routes.cjs"));

  // ================= MASTERS =================
  router.use("/api/resorts", protect, require("./routes/resort.routes.cjs"));
  router.use("/api/stores", protect, require("./routes/store.routes.cjs"));
  router.use("/api/items", protect, require("./routes/item.routes.cjs"));
  router.use(
    "/api/item-categories",
    protect,
    require("./routes/itemCategory.routes.cjs")
  );
  router.use("/api/vendors", protect, require("./routes/vendor.routes.cjs"));
  router.use("/api/recipes", protect, require("./routes/recipe.routes.cjs"));

  // ================= REQUISITION FLOW =================
  router.use(
    "/api/requisitions",
    protect,
    require("./routes/requisition.routes.cjs")
  );

  router.use("/api/po", protect, require("./routes/po.routes.cjs"));
  router.use("/api/grn", protect, require("./routes/grn.routes.cjs"));

  // ================= STORE OPS =================
  router.use(
    "/api/consumption",
    protect,
    require("./routes/consumption.routes.cjs")
  );

  router.use(
    "/api/store-replacements",
    protect,
    require("./routes/storeReplacement.routes.cjs")
  );

  return router;
}

module.exports = { createRouter };
