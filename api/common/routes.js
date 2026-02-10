const express = require("express");
const router = express.Router();
// api routes
// const { login } = require("../modules/auth/auth_controller");
const auth = require("../modules/auth/auth_controller");
const whatsapp = require("../modules/whatsapp/whatsapp_controller");
const product = require("../modules/product/product_controller");
// middleware
const { authMiddleware } = require("../modules/auth/auth_middleware");

router.get("/", (req, res) => {
    res.status(200).send("API is running");
});

/// =================ROUTES API=======================

// Product and checkout routes
router.get("/get_product", product.get_product); // get product for home
router.get("/get_product/:slug", product.get_product); // get product for checkout
// router.post("/checkout", authMiddleware, product.checkout); // checkout process

// WhatsApp routes
router.get("/check_whatsapp/:phone", whatsapp.check_whatsapp); // check whatsapp

// ================ ROUTES AUTH ================
router.post("/auth/register", auth.register); 
router.post("/auth/login", auth.login);
router.post("/auth/verify_token", authMiddleware, auth.verifyToken); // cek token dan validasi user


module.exports = router;