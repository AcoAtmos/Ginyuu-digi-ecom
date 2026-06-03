const router = require("express").Router();
const controller = require("./order.controller");
const { authenticateAdmin } = require("../../middleware/auth-admin.middleware");
const { db } = require("../../config/db");

// API — semua protected
router.get("/api/admin/orders", authenticateAdmin, controller.list);
router.get("/api/admin/orders/detail/:id", authenticateAdmin, controller.detail);
router.post("/api/admin/orders/create", authenticateAdmin, controller.create);
router.put("/api/admin/orders/edit/:id", authenticateAdmin, controller.update);
router.delete("/api/admin/orders/delete/:id", authenticateAdmin, controller.remove);

// Product list for item selector
router.get("/api/admin/products/list", authenticateAdmin, async (req, res) => {
    try {
        const { rows } = await db.query(
            `SELECT id, name, price, slug FROM product ORDER BY name`
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = { router, prefix: "" };
