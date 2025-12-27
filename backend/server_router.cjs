// backend/server_router.cjs
// 🔥 SINGLE SOURCE ROUTER — ALL MODELS + ROUTES LOADED HERE

const express = require("express");

function createRouter({ mongoose }) {
  const router = express.Router();

  // =========================
  // 🔐 LOAD MODELS (ONCE)
  // =========================

  // Core
  require("./models/user.model.cjs")(mongoose);
  require("./models/role.model.cjs")(mongoose);

  // Masters
  require("./models/resort.model.cjs")(mongoose);
  require("./models/store.model.cjs")(mongoose);
  require("./models/vendor.model.cjs")(mongoose);
  require("./models/item.model.cjs")(mongoose);
  require("./models/itemCategory.model.cjs")(mongoose);
  require("./models/recipe.model.cjs")(mongoose);

  // Stock
  require("./models/storeStock.model.cjs")(mongoose);

  // Transactions
  require("./models/requisition.model.cjs")(mongoose);
  require("./models/po.model.cjs")(mongoose);
  require("./models/grn.model.cjs")(mongoose);
  require("./models/consumption.model.cjs")(mongoose);
  require("./models/storeReplacement.model.cjs")(mongoose);

  console.log("✅ All models loaded");

  // =========================
  // 🔑 AUTH MIDDLEWARE
  // =========================
  const auth = require("./middlewares/auth.cjs");

  // =========================
  // 🚏 ROUTES
  // =========================

  // Auth
  require("./routes/auth.routes.cjs")(router);

  // Role & User
  require("./routes/role.routes.cjs")(router, auth);
  require("./routes/user.routes.cjs")(router, auth);

  // Masters
  require("./routes/resort.routes.cjs")(router, auth);
  require("./routes/store.routes.cjs")(router, auth);
  require("./routes/vendor.routes.cjs")(router, auth);
  require("./routes/item.routes.cjs")(router, auth);
  require("./routes/itemCategory.routes.cjs")(router, auth);
  require("./routes/recipe.routes.cjs")(router, auth);

  // Transactions
  require("./routes/requisition.routes.cjs")(router, auth);
  require("./routes/po.routes.cjs")(router, auth);
  require("./routes/grn.routes.cjs")(router, auth);
  require("./routes/consumption.routes.cjs")(router, auth);
  require("./routes/storeReplacement.routes.cjs")(router, auth);

  // =========================
  // 🧪 HEALTH CHECK
  // =========================
  router.get("/api/_health", (req, res) =>
    res.json({ ok: true, time: new Date() })
  );

  return router;
}

module.exports = { createRouter };
