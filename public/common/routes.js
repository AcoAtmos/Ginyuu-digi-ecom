const express = require("express");
const router = express.Router();
//get controller
const {
    checkout,
    landing,

} = require("../modules/views_controller");


router.get("/", landing);




router.get ("/checkout" , checkout);
module.exports = router;