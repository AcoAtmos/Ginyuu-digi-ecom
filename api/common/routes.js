const express = require("express");
const router = express.Router();
// api routes
// const { login } = require("../modules/auth/auth_controller");
const auth = require("../modules/auth/auth_controller");
const whatsapp = require("../modules/whatsapp/whatsapp_controller");
const product = require("../modules/product/product_controller");
const checkout = require("../modules/checkout/checkout_controller");

// middleware
const { authMiddleware, adminMiddleware } = require("../modules/auth/auth_middleware");

// user
const user = require("../modules/user/member/member_controller");

router.get("/", (req, res) => {
    res.status(200).send("API is running");
});

/// =================ROUTES API=======================

// Product and checkout routes
router.get("/product/home", product.get_product_home); // get product for home // baru  
router.get("/product/category/:page/:limit", product.get_product_category); // get product for category
// router.get("/get_product", product.get_product); // get product for home
router.get("/get_product/:slug", product.get_product); // get product for checkout
router.get("/get_invoice/:invoice_number", checkout.getInvoice); // get invoice by number
router.post("/checkout", checkout.checkout); // checkout process

// WhatsApp routes
router.get("/check_whatsapp/:phone", whatsapp.check_whatsapp); // check whatsapp

// ================ ROUTES AUTH ================
router.post("/auth/register", auth.register); 
router.post("/auth/login", auth.login);
router.post("/auth/verify_token",auth.verifyToken); // cek token dan validasi user
router.get("/auth/me", authMiddleware, auth.getMe); // get current user
router.post("/auth/logout", auth.logout); // logout

// ================ USER ====================
// profile - get my profile
router.get("/profile/me", authMiddleware, user.get_my_profile);

// purchase history - get my purchases (member)
router.get("/purchases", authMiddleware, user.get_my_purchases);

// ======== ADMIN ========
router.get("/admin/purchases", authMiddleware, adminMiddleware, user.get_all_purchases); 

module.exports = router;