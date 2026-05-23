const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");

dotenv.config();

const app = express();

// Middleware
app.use(cors({ origin: process.env.FE_URL || '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// EJS config
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use((req, res, next) => {
    res.locals.BE_URL = process.env.BASE_URL || process.env.BE_URL || `http://localhost:${process.env.PORT || 4100}`;
    next();
});

// Cors
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'https://yearning-batch-comment.ngrok-free.dev');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// Static files
app.use("/assets", express.static(path.join(__dirname, "public", "assets")));
app.use("/common", express.static(path.join(__dirname, "public", "common")));

// Web pages
const webController = require("./controllers/web.controller");
app.get("/", webController.landing);
app.get("/checkout", webController.checkout);
app.get("/checkout/waiting-payment", webController.waiting_for_payment);
app.get("/reset-password", webController.resetPassword);
app.get("/profile", webController.profile);
app.get("/profile/settings", webController.profile_settings);
app.get("/profile/purchases", webController.profile_purchases);
app.get("/profile/security", webController.security);

// Feature routes
const { router: authRoutes, prefix: authPrefix } = require("./features/auth/auth.routes");
const { router: cartRoutes, prefix: cartPrefix } = require("./features/cart/cart.routes");
const { router: checkoutRoutes, prefix: checkoutPrefix } = require("./features/checkout/checkout.routes");
const { router: paymentRoutes, prefix: paymentPrefix } = require("./features/payment/payment.routes");
const { router: productRoutes, prefix: productPrefix } = require("./features/product/product.routes");
const { router: promoRoutes, prefix: promoPrefix } = require("./features/promo/promo.routes");
const { router: userRoutes, prefix: userPrefix } = require("./features/user/user.routes");
const { router: whatsappRoutes, prefix: whatsappPrefix } = require("./features/whatsapp/whatsapp.routes");
const { router: notificationRoutes, prefix: notificationPrefix } = require('./features/notification/notification.routes');

app.use("/api" + authPrefix, authRoutes);
app.use("/api" + cartPrefix, cartRoutes);
app.use("/api" + checkoutPrefix, checkoutRoutes);
app.use("/api" + paymentPrefix, paymentRoutes);
app.use("/api" + productPrefix, productRoutes);
app.use("/api" + promoPrefix, promoRoutes);
app.use("/api" + userPrefix, userRoutes);
app.use("/api" + whatsappPrefix, whatsappRoutes);
app.use("/api" + notificationPrefix, notificationRoutes);

// Legacy route: get_product by slug
const productController = require("./features/product/product.controller");
app.get("/api/get_product/:slug", productController.get_product);

// Background worker
const { send_email_worker } = require("./shared/services/email.service");
setInterval(async () => {
    // console.log('10 seconds have passed');
    await send_email_worker();
}, 10000);

// Start
const PORT = process.env.PORT || 4100;
app.listen(PORT, () => {
    console.log(`server berjalan pada port ${PORT} yatta`);
});
