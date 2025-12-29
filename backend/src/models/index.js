// backend/src/models/index.js
// =======================================
// 🔥 MODEL LOADER (SINGLE SOURCE OF TRUTH)
// =======================================

module.exports = () => {
  // CORE
  require("./user.model");
  require("./role.model");

  // MASTER
  require("./resort.model");
  require("./store.model");
  require("./item.model");
  require("./vendor.model");

  // TRANSACTIONS
  require("./requisition.model");
  require("./po.model");
  require("./grn.model");

  // STOCK
  require("./storeStock.model");

  // OPTIONAL (if present)
  try { require("./consumption.model"); } catch {}
  try { require("./storeReplacement.model"); } catch {}

  console.log("✅ All MongoDB models loaded");
};
