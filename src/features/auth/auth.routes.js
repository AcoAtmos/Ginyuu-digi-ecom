const router = require("express").Router();
const controller = require("./auth.controller");

router.post("/register", controller.register);
router.post("/login", controller.login);
router.post("/verify_token", controller.verifyToken);
router.post("/register_checkout", controller.registerCheckout);
router.get("/me", controller.getMe);
router.post("/logout", controller.logout);

module.exports = { router, prefix: "/auth" };
