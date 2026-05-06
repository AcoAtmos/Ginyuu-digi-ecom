const express = require("express");
const router = express.Router();
const {
    checkout,
    landing,
    waiting_for_payment
} = require("../modules/views_controller");

router.get("/", landing);
router.get("/checkout", checkout);
router.get("/checkout/waiting-payment", waiting_for_payment);

module.exports = router;