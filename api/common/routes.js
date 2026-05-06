const express = require("express");
const router = express.Router();
// api routes
// const { login } = require("../modules/auth/auth_controller");
const auth = require("../modules/auth/auth_controller");
const whatsapp = require("../modules/whatsapp/whatsapp_controller");
const product = require("../modules/product/product_controller");
const checkout = require("../modules/checkout/checkout_controller");
const payment = require("../modules/payment/payment_controller");
const cart = require("../modules/cart/cart_controller");
const promo = require("../modules/promo/promo_controller");

// middleware
const { authMiddleware, adminMiddleware } = require("../modules/auth/auth_middleware");

// user
const user = require("../modules/user/member/member_controller");

router.get("/", (req, res) => {
    res.status(200).send("API is running");
});

/// =================ROUTES API=======================

// =================== GET PRODUCT ===================
router.get("/product", product.get_all_product); // get all product
router.get("/product/home", product.get_product_home); // get product for home
router.get("/product/category/:page/:limit", product.get_product_category); // get product for category
router.get("/get_product/:slug", product.get_product); // get product for checkout

// =================== CART ===================
router.get("/cart", authMiddleware, cart.getCart);
router.post("/cart", authMiddleware, cart.addItem);
router.delete("/cart/:product_id", authMiddleware, cart.removeItem);
router.post("/cart/sync", authMiddleware, cart.syncCart);

// =================== PROMO ===================
router.post("/promo/validate", promo.validatePromo);

// =================== CHECKOUT ===================
router.post("/checkout", checkout.checkout); // checkout process
router.post("/checkout/cancel", checkout.cancelOrder); // cancel pending order

// =================== WHATSAPP ===================
router.get("/check_whatsapp/:phone", whatsapp.check_whatsapp); // check whatsapp

// =================== PAYMENT ===================
router.get("/get_invoice/:invoice_number", payment.getInvoice); // get invoice by number
router.post("/payment_process", payment.paymentProcess); // payment process

// =================== AUTH ===================
router.post("/auth/register", auth.register); 
router.post("/auth/login", auth.login);
router.post("/auth/verify_token",auth.verifyToken); // cek token dan validasi user
router.get("/auth/me", authMiddleware, auth.getMe); // get current user
router.post("/auth/logout", auth.logout); // logout

// ================ USER ====================
router.get("/profile/me", authMiddleware, user.get_my_profile);

router.get("/purchases", authMiddleware, user.get_my_purchases);

// ================= ADMIN ==================
router.get("/admin/purchases", authMiddleware, adminMiddleware, user.get_all_purchases); 

module.exports = router;