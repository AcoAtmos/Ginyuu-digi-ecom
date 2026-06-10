const service = require("./auth.service");
const jwt = require("jsonwebtoken");

// Views (for when FE is built)
exports.login_view = async (req, res) => {
    res.render("login");
};

exports.forget_password_view = async (req, res) => {
    res.render("forget-password");
};

exports.reset_password_view = async (req, res) => {
    res.render("reset-password", { token: req.params.token });
};

// API
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ code: 400, status: "error", message: "Email and password are required" });
        }

        const user = await service.login({ email, password });
        const token = jwt.sign(
            {
                id: user.id,
                role: user.role,
                status: user.status,
                username: user.username,
                email: user.email,
                phone: user.phone,
                image_url: user.image_url
            },
            process.env.ADMIN_JWT_SECRET,
            { expiresIn: "24h" }
        );

        res.cookie("admin_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 24 * 60 * 60 * 1000,
            path: "/",
        });

        return res.status(200).json({
            code: 200,
            status: "success",
            message: "Login successful",
            data: {
                user: {
                    username: user.username,
                    email: user.email,
                    phone: user.phone,
                    image_url: user.image_url,
                    role: user.role
                }
            }
        });
    } catch (err) {
        const status = err.message === "Invalid email or password" || err.message === "Access denied. Admin only."
            ? 401 : 500;
        return res.status(status).json({
            code: status,
            status: "error",
            message: err.message
        });
    }
};

exports.logout = async (req, res) => {
    res.cookie("admin_token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        expires: new Date(0),
        path: "/"
    });
    return res.status(200).json({
        code: 200,
        status: "success",
        message: "Logged out successfully"
    });
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ code: 400, status: "error", message: "Email is required" });
        }
        await service.forgotPassword(email);
        return res.status(200).json({
            code: 200,
            status: "success",
            message: "If the email exists, a reset link has been sent"
        });
    } catch (err) {
        return res.status(500).json({ code: 500, status: "error", message: err.message });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;
        if (!token || !password) {
            return res.status(400).json({ code: 400, status: "error", message: "Token and password are required" });
        }
        if (password.length < 8) {
            return res.status(400).json({ code: 400, status: "error", message: "Password must be at least 8 characters" });
        }
        await service.resetPassword(token, password);
        return res.status(200).json({
            code: 200,
            status: "success",
            message: "Password reset successfully"
        });
    } catch (err) {
        const status = err.message === 'Invalid or expired token' ? 400 : 500;
        return res.status(status).json({ code: status, status: "error", message: err.message });
    }
};

exports.verifyToken = async (req, res) => {
    const token = req.cookies?.admin_token;
    if (!token) {
        return res.status(200).json({ code: 200, status: "success", message: "No token found", data: null });
    }

    try {
        const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
        if (decoded.role !== 'ADMIN' || decoded.status !== 'active') {
            return res.status(200).json({ code: 200, status: "success", message: "No token found", data: null });
        }
        return res.status(200).json({
            code: 200,
            status: "success",
            message: "Token verified",
            data: { user: decoded }
        });
    } catch (err) {
        return res.status(200).json({ code: 200, status: "success", message: "No token found", data: null });
    }
};
