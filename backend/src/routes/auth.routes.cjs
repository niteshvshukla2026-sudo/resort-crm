const express = require("express");
const {
  login,
  forceResetPassword,
} = require("../controllers/auth.controller.cjs");

module.exports = function (router) {
  router.post("/api/auth/login", login);
  router.get("/api/auth/force-reset", forceResetPassword);
};
