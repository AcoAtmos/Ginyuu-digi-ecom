const router = require("express").Router();
const controller = require("./checkout.controller");

router.post("/", controller.checkout);
router.post("/cancel", controller.cancelOrder);

module.exports = { router, prefix: "/checkout" };
