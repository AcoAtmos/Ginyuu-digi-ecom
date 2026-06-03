const router = require("express").Router();
const controller = require("./profile.controller");
const { authenticateAdmin } = require("../../middleware/auth-admin.middleware");

router.get("/api/profile", authenticateAdmin, controller.view);
router.post("/api/profile/change-password", authenticateAdmin, controller.changePassword);

module.exports = { router, prefix: "" };
