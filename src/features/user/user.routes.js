const router = require("express").Router();
const controller = require("./user.controller");
const { authMiddleware, adminMiddleware } = require("../../shared/middleware/auth.middleware");

router.get("/profile/me", authMiddleware, controller.get_my_profile);
router.put("/profile/me", authMiddleware, controller.update_my_profile);
router.get("/purchases", authMiddleware, controller.get_my_purchases);
router.get("/admin/purchases", authMiddleware, adminMiddleware, controller.get_all_purchases);

module.exports = { router, prefix: "" };
