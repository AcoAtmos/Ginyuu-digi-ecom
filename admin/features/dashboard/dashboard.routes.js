const router = require("express").Router();
const controller = require("./dashboard.controller");
const { authenticateAdmin } = require("../../middleware/auth-admin.middleware");

router.get("/dashboard", authenticateAdmin, controller.index);
router.get("/api/admin/dashboard/stats", authenticateAdmin, controller.stats);

module.exports = { router, prefix: "" };
