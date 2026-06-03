const service = require("./profile.service");

exports.view = async (req, res) => {
    try {
        const user = await service.getProfile(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        console.error("profile view error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { current_password, new_password } = req.body;
        if (!current_password || !new_password) {
            return res.status(400).json({ success: false, message: "current_password and new_password are required" });
        }
        if (new_password.length < 6) {
            return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
        }
        await service.changePassword(req.user.id, current_password, new_password);
        res.status(200).json({ success: true, message: "Password changed successfully" });
    } catch (error) {
        if (error.message === "Current password is incorrect") {
            return res.status(400).json({ success: false, message: error.message });
        }
        console.error("profile changePassword error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
