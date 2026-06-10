const router = require("express").Router();
const controller = require("./auth.controller");

router.post("/register", controller.register);
router.post("/login", controller.login);
router.get("/verify-email", controller.verifyEmail);
router.post("/resend-verification", controller.resendVerification);
router.post("/verify_token", controller.verifyToken);
router.post("/register_checkout", controller.registerCheckout);
router.get("/me", controller.getMe);
router.post("/logout", controller.logout);
router.post("/forgot-password", controller.forgotPassword);
router.post("/reset-password", controller.resetPassword);

module.exports = { router, prefix: "/auth" };
