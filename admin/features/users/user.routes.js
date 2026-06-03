const router = require("express").Router();
const controller = require("./user.controller");
const { authenticateAdmin } = require("../../middleware/auth-admin.middleware");

router.get("/api/admin/users", authenticateAdmin, controller.list);
router.get("/api/admin/users/detail/:id", authenticateAdmin, controller.detail);
router.post("/api/admin/users/create", authenticateAdmin, controller.create);
router.put("/api/admin/users/edit/:id", authenticateAdmin, controller.update);
router.delete("/api/admin/users/delete/:id", authenticateAdmin, controller.remove);
router.post("/api/admin/users/reset-password/:id", authenticateAdmin, controller.resetPassword);

module.exports = { router, prefix: "" };
