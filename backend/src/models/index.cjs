// src/models/index.cjs
// ✅ PURE COMMONJS

module.exports = {
  User: require("./user.model"),
  Role: require("./role.model"),
  Resort: require("./resort.model"),
  Store: require("./store.model"),
  Item: require("./item.model"),
 
  Vendor: require("./vendor.model"),
  Requisition: require("./requisition.model"),
  PO: require("./po.model"),
  GRN: require("./grn.model"),
  StoreStock: require("./storeStock.model"),
  Consumption: require("./consumption.model"),
  Recipe: require("./recipe.model"),
  StoreReplacement: require("./storeReplacement.model"),
};
