const router = require("express").Router();
const controller = require("./promo.controller");

router.post("/validate", controller.validatePromo);

module.exports = { router, prefix: "/promo" };
