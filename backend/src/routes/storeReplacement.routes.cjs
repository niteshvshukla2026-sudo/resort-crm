const permit = require("../middlewares/permit.cjs");

module.exports = (router) => {
  const ctrl = require("../controllers/storeReplacement.controller.cjs");

  router.get(
    "/api/store-replacements",
    permit("STORE_REPLACEMENT", "READ"),
    ctrl.list
  );

  router.post(
    "/api/store-replacements",
    permit("STORE_REPLACEMENT", "CREATE"),
    ctrl.create
  );

  router.patch(
    "/api/store-replacements/:id/issue-vendor",
    permit("STORE_REPLACEMENT", "UPDATE"),
    ctrl.issueToVendor
  );

  router.post(
    "/api/store-replacements/:id/create-grn",
    permit("STORE_REPLACEMENT", "APPROVE"),
    ctrl.createGrn
  );
};
