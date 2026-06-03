const service = require("./user.service");

exports.list = async (req, res) => {
    try {
        const { search, sort, page, limit } = req.query;
        const result = await service.getList({ search, sort, page, limit });
        res.status(200).json(result);
    } catch (error) {
        console.error("user list error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.detail = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await service.getDetail(id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        console.error("user detail error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const { username, email, password, phone } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ success: false, message: "username, email, and password are required" });
        }
        const user = await service.create({ username, email, password, phone });
        res.status(201).json({ success: true, data: user });
    } catch (error) {
        if (error.message.includes("duplicate key") || error.message.includes("already exists")) {
            return res.status(409).json({ success: false, message: "Email already exists" });
        }
        console.error("user create error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const fields = req.body;
        const user = await service.update(id, fields);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        console.error("user update error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.remove = async (req, res) => {
    try {
        const { id } = req.params;
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ success: false, message: "Cannot delete your own account" });
        }
        const deleted = await service.remove(id);
        if (!deleted) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.status(200).json({ success: true, message: "User deleted successfully" });
    } catch (error) {
        console.error("user delete error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { new_password } = req.body;
        const user = await service.resetPassword(id, new_password || "Admin123!");
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.status(200).json({ success: true, message: "Password reset successfully" });
    } catch (error) {
        console.error("user resetPassword error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
