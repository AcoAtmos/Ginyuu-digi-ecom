const express = require("express");
const router = express.Router();
//get controller
const {
    home,
    product,
    login,
    register,
    showcase,
    checkout,
    profile
} = require("../modules/views_controller");

// router.get("/", (req,res)=>{
//     res.send("halooo");
// });



router.get ("/home" , home);
router.get ("/product" , product);
router.get ("/login" , login);
router.get ("/register" , register);
router.get ("/showcase" , showcase);
router.get ("/checkout/:slug" , checkout);
router.get ("/profile" , profile);
module.exports = router;