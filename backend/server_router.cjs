// backend/server_router.cjs
// 🔥 SINGLE SOURCE ROUTER — ALL MODELS + ROUTES LOADED HERE

const express = require("express");

function createRouter({ mongoose }) {
  const router = express.Router();

  // =========================
  // 🔐 LOAD MODELS (ONCE)
  // =========================

  // Core
  require("./src/models/user.model.cjs")(mongoose);
  require("./src/models/role.model.cjs")(mongoose);

  // Masters
  require("./src/models/resort.model.cjs")(mongoose);
  require("./src/models/store.model.cjs")(mongoose);
  require("./src/models/vendor.model.cjs")(mongoose);
  require("./src/models/item.model.cjs")(mongoose);
  require("./src/models/itemCategory.model.cjs")(mongoose);
  require("./src/models/recipe.model.cjs")(mongoose);
  require("./src/models/department.model.cjs")(mongoose);

  // Stock
  require("./src/models/storeStock.model.cjs")(mongoose);

  // Transactions
  require("./src/models/requisition.model.cjs")(mongoose);
  require("./src/models/po.model.cjs")(mongoose);
  require("./src/models/grn.model.cjs")(mongoose);
  require("./src/models/consumption.model.cjs")(mongoose);
  require("./src/models/storeReplacement.model.cjs")(mongoose);

  console.log("✅ All models loaded successfully");

  // =========================
  // 🔑 AUTH MIDDLEWARE
  // =========================
  const auth = require("./src/middlewares/auth.cjs");

  // =========================
  // 🚏 ROUTES
  // =========================

  // Auth
  require("./src/routes/auth.routes.cjs")(router);

  // Role & User
  require("./src/routes/role.routes.cjs")(router, auth);
  require("./src/routes/user.routes.cjs")(router, auth);

  // Masters
  require("./src/routes/resort.routes.cjs")(router, auth);
  require("./src/routes/store.routes.cjs")(router, auth);
  require("./src/routes/vendor.routes.cjs")(router, auth);
  require("./src/routes/item.routes.cjs")(router, auth);
  require("./src/routes/itemCategory.routes.cjs")(router, auth);
  require("./src/routes/recipe.routes.cjs")(router, auth);

  // Transactions
  require("./src/routes/requisition.routes.cjs")(router, auth);
  require("./src/routes/po.routes.cjs")(router, auth);
  require("./src/routes/grn.routes.cjs")(router, auth);
  require("./src/routes/consumption.routes.cjs")(router, auth);
  require("./src/routes/storeReplacement.routes.cjs")(router, auth);

  // =========================
  // 🧪 HEALTH CHECK
  // =========================
  router.get("/api/_health", (req, res) => {
    res.json({ ok: true, time: new Date() });
  });

  return router;
}

module.exports = { createRouter };
