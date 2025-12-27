// backend/server_router.cjs
// 🔥 FINAL CONSOLIDATED ROUTER
// All MODELS + ROUTES loaded in ONE place
// Used directly by server.cjs

const express = require("express");

function createRouter({ mongoose }) {
  const router = express.Router();

  // ===============================
  // 🔹 LOAD MODELS (ONCE ONLY)
  // ===============================
  require("./models/role.model.cjs")(mongoose);
  require("./models/user.model.cjs")(mongoose);
  require("./models/resort.model.cjs")(mongoose);

  require("./models/department.model.cjs")(mongoose);
  require("./models/store.model.cjs")(mongoose);
  require("./models/vendor.model.cjs")(mongoose);

  require("./models/itemCategory.model.cjs")(mongoose);
  require("./models/item.model.cjs")(mongoose);

  require("./models/requisition.model.cjs")(mongoose);
  require("./models/po.model.cjs")(mongoose);
  require("./models/grn.model.cjs")(mongoose);

  require("./models/storeStock.model.cjs")(mongoose);
  require("./models/storeReplacement.model.cjs")(mongoose);

  require("./models/consumption.model.cjs")(mongoose);

  console.log("✅ All models loaded");

  // ===============================
  // 🔹 LOAD ROUTES
  // ===============================
  require("./routes/auth.routes.cjs")(router, mongoose);

  require("./routes/role.routes.cjs")(router, mongoose);
  require("./routes/user.routes.cjs")(router, mongoose);
  require("./routes/resort.routes.cjs")(router, mongoose);

  require("./routes/department.routes.cjs")(router, mongoose);
  require("./routes/store.routes.cjs")(router, mongoose);
  require("./routes/vendor.routes.cjs")(router, mongoose);

  require("./routes/itemCategory.routes.cjs")(router, mongoose);
  require("./routes/item.routes.cjs")(router, mongoose);

  require("./routes/requisition.routes.cjs")(router, mongoose);
  require("./routes/po.routes.cjs")(router, mongoose);
  require("./routes/grn.routes.cjs")(router, mongoose);

  require("./routes/storeReplacement.routes.cjs")(router, mongoose);
  require("./routes/consumption.routes.cjs")(router, mongoose);

  console.log("✅ All routes loaded");

  return router;
}

module.exports = { createRouter };
