const { get_my_profile, update_my_profile, requestEmailChange, changePasswordService, get_my_purchases, get_all_purchases } = require("./user.service");

exports.get_my_profile = async (req, res) => {
    await get_my_profile(req, res);
};

exports.update_my_profile = async (req, res) => {
    await update_my_profile(req, res);
};

exports.requestEmailChange = async (req, res) => {
    try {
        const userId = req.user.id;
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: "Email is required" });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: "Invalid email format" });
        }
        await requestEmailChange(userId, email);
        res.status(200).json({ success: true, message: "Verification email sent to your new address" });
    } catch (err) {
        if (err.message === "New email is the same as current email" || err.message === "Email already in use") {
            return res.status(400).json({ success: false, message: err.message });
        }
        console.error("requestEmailChange error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ success: false, message: "Semua field wajib diisi" });
        }
        if (newPassword.length < 8) {
            return res.status(400).json({ success: false, message: "Password minimal 8 karakter" });
        }
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ success: false, message: "Password baru tidak cocok" });
        }
        await changePasswordService(req.user.id, currentPassword, newPassword);
        res.status(200).json({ success: true, message: "Password updated successfully" });
    } catch (err) {
        if (err.message === "Current password is incorrect") {
            return res.status(400).json({ success: false, message: err.message });
        }
        console.error("changePassword error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.get_my_purchases = async (req, res) => {
    await get_my_purchases(req, res);
};

exports.get_all_purchases = async (req, res) => {
    await get_all_purchases(req, res);
};
