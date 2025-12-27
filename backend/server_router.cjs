// backend/server_router.cjs
// 🔥 FINAL ROUTER — USED DIRECTLY BY server.cjs

const express = require("express");
const { createControllers } = require("./controllers.cjs");

function createRouter({ mongoose }) {
  const router = express.Router();

  // ==================================================
  // 🔥 LOAD ALL MODELS (ONCE)
  // ==================================================
  require("./models/role.model")(mongoose);
  require("./models/user.model")(mongoose);
  require("./models/resort.model")(mongoose);

  require("./models/department.model")(mongoose);
  require("./models/store.model")(mongoose);
  require("./models/vendor.model")(mongoose);

  require("./models/itemCategory.model")(mongoose);
  require("./models/item.model")(mongoose);

  require("./models/requisition.model")(mongoose);
  require("./models/po.model")(mongoose);
  require("./models/grn.model")(mongoose);

  require("./models/storeStock.model")(mongoose);
  require("./models/storeReplacement.model")(mongoose);

  require("./models/consumption.model")(mongoose); // ✅ IMPORTANT

  // ==================================================
  // 🔥 INIT CONTROLLERS
  // ==================================================
  const c = createControllers({ mongoose });

  // ==================================================
  // 🔐 ROLE ROUTES
  // ==================================================
  router.get("/api/roles", c.listRoles);
  router.post("/api/roles", c.createRole);
  router.put("/api/roles/:id", c.updateRole);
  router.delete("/api/roles/:id", c.deleteRole);

  // ==================================================
  // 👤 USER ROUTES
  // ==================================================
  router.get("/api/users", c.listUsers);
  router.post("/api/users", c.createUser);
  router.put("/api/users/:id", c.updateUser);
  router.delete("/api/users/:id", c.deleteUser);

  // ==================================================
  // 🏝️ RESORT ROUTES
  // ==================================================
  router.get("/api/resorts", c.listResorts);
  router.post("/api/resorts", c.createResort);
  router.put("/api/resorts/:id", c.updateResort);
  router.delete("/api/resorts/:id", c.deleteResort);

  // ==================================================
  // 🏢 DEPARTMENT ROUTES
  // ==================================================
  router.get("/api/departments", c.listDepartments);
  router.post("/api/departments", c.createDepartment);
  router.put("/api/departments/:id", c.updateDepartment);
  router.delete("/api/departments/:id", c.deleteDepartment);

  // ==================================================
  // 🏬 STORE ROUTES
  // ==================================================
  router.get("/api/stores", c.listStores);
  router.post("/api/stores", c.createStore);
  router.put("/api/stores/:id", c.updateStore);
  router.delete("/api/stores/:id", c.deleteStore);

  // ==================================================
  // 🧾 VENDOR ROUTES
  // ==================================================
  router.get("/api/vendors", c.listVendors);
  router.post("/api/vendors", c.createVendor);
  router.put("/api/vendors/:id", c.updateVendor);
  router.delete("/api/vendors/:id", c.deleteVendor);

  // ==================================================
  // 📦 ITEM CATEGORY ROUTES
  // ==================================================
  router.get("/api/item-categories", c.listItemCategories);
  router.post("/api/item-categories", c.createItemCategory);
  router.put("/api/item-categories/:id", c.updateItemCategory);
  router.delete("/api/item-categories/:id", c.deleteItemCategory);

  // ==================================================
  // 📦 ITEM ROUTES
  // ==================================================
  router.get("/api/items", c.listItems);
  router.post("/api/items", c.createItem);
  router.put("/api/items/:id", c.updateItem);
  router.delete("/api/items/:id", c.deleteItem);

  // ==================================================
  // 📝 REQUISITION ROUTES
  // ==================================================
  router.get("/api/requisitions", c.listRequisitions);
  router.post("/api/requisitions", c.createRequisition);
  router.put("/api/requisitions/:id", c.updateRequisition);
  router.delete("/api/requisitions/:id", c.deleteRequisition);

  router.post("/api/requisitions/:id/approve", c.approveRequisition);
  router.post("/api/requisitions/:id/hold", c.holdRequisition);
  router.post("/api/requisitions/:id/reject", c.rejectRequisition);

  router.post("/api/requisitions/:id/create-po", c.createPOFromRequisition);
  router.post("/api/requisitions/:id/create-grn", c.createGRNFromRequisition);

  // ==================================================
  // 🔁 STORE REPLACEMENT ROUTES
  // ==================================================
  router.get("/api/store-replacements", c.listStoreReplacements);
  router.post("/api/store-replacements", c.createStoreReplacement);
  router.patch(
    "/api/store-replacements/:id/issue-vendor",
    c.issueReplacementToVendor
  );
  router.post(
    "/api/store-replacements/:id/create-grn",
    c.createReplacementGRN
  );

  // ==================================================
  // 🔻 CONSUMPTION ROUTES (STOCK MINUS)
  // ==================================================
  router.get("/api/consumptions", c.listConsumptions);
  router.post("/api/consumptions", c.createConsumption);
  router.delete("/api/consumptions/:id", c.deleteConsumption);

  return router;
}

module.exports = { createRouter };
