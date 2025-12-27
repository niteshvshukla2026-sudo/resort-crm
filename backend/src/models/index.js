// backend/src/models/index.js
// ✅ PURE COMMONJS MODEL LOADER

module.exports = function loadModels() {
  require("./user.model.js");
  require("./role.model.js");

  require("./store.model.js");
  require("./storeStock.model.js");
  require("./storeReplacement.model.js");

  require("./itemCategory.model.js");
  require("./item.model.js");
  require("./recipe.model.js");

  require("./vendor.model.js");

  require("./requisition.model.js");
  require("./po.model.js");
  require("./grn.model.js");

  require("./consumption.model.js");

  console.log("✅ All models loaded (CJS)");
};
