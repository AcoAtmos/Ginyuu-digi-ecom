const router = require("express").Router();
const controller = require("./auth.controller");
const { authenticateAdmin, redirectIfAuthenticated } = require("../../middleware/auth-admin.middleware");

// Views
router.get("/login", redirectIfAuthenticated, controller.login_view);
router.get("/forget-password", redirectIfAuthenticated, controller.forget_password_view);
router.get("/forget-password", controller.forget_password_view);
router.get("/reset-password/:token", controller.reset_password_view);
 
// API
router.post("/login", controller.login);
router.post("/logout", authenticateAdmin, controller.logout);
router.post("/forget-password", controller.forgotPassword);
router.post("/reset-password", controller.resetPassword);
router.get("/verify", controller.verifyToken);

module.exports = { router, prefix: "/auth" };
