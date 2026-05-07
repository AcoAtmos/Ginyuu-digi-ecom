const router = require("express").Router();
const controller = require("./payment.controller");

router.get("/get_invoice/:invoice_number", controller.getInvoice);
router.post("/payment_process", controller.paymentProcess);

module.exports = { router, prefix: "" };
