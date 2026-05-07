const router = require("express").Router();
const controller = require("./cart.controller");
const { authMiddleware } = require("../../shared/middleware/auth.middleware");

router.get("/", authMiddleware, controller.getCart);
router.post("/", authMiddleware, controller.addItem);
router.delete("/:product_id", authMiddleware, controller.removeItem);
router.post("/sync", authMiddleware, controller.syncCart);

module.exports = { router, prefix: "/cart" };
