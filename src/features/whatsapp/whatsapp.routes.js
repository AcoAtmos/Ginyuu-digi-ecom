const router = require("express").Router();
const controller = require("./whatsapp.controller");

router.get("/check_whatsapp/:phone", controller.check_whatsapp);

module.exports = { router, prefix: "" };
