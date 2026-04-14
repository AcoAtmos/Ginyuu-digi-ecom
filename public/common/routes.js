const express = require("express");
const router = express.Router();
//get controller
const {
    home,
    browsAll,
    login,
    register,
    checkout,
    waitingPayment,
    profile
} = require("../modules/views_controller");

router.get("/",home );



router.get ("/home" , home);
router.get ("/browsAll" , browsAll);
router.get ("/login" , login);
router.get ("/register" , register);
router.get ("/checkout/waiting-payment" , waitingPayment);
router.get ("/checkout/:slug" , checkout);
router.get ("/profile" , profile);
module.exports = router;