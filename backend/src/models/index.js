module.exports = (mongoose) => {
  require("./user.model")(mongoose);
  require("./role.model")(mongoose);
  require("./store.model")(mongoose);
  require("./storeStock.model")(mongoose);
  require("./storeReplacement.model")(mongoose);
  require("./itemCategory.model")(mongoose);
  require("./item.model")(mongoose);
  require("./recipe.model")(mongoose);
  require("./vendor.model")(mongoose);
  require("./requisition.model")(mongoose);
  require("./po.model")(mongoose);
  require("./grn.model")(mongoose);
  require("./consumption.model")(mongoose);
};