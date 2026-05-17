const router = require("express").Router();
const controller = require("./payment.controller");

router.get("/get_invoice/:invoice_number", controller.getInvoice);
router.post("/create_qris", controller.createQris);
router.post("/webhook", controller.webhookHandler);

module.exports = { router, prefix: "" };
