const { register, login, forgotPassword, resetPassword, registerCheckout } = require("./auth.service");
const jwt = require("jsonwebtoken");
const { db } = require("../../config/database");

exports.register = async (req, res) => {
    try {
        const result = await register(req.body);
        res.status(200).json({
            status: "success",
            message: "User registered successfully",
            data: result
        });
    } catch (err) {
        return res.status(500).json({
            status: "error server error cik",
            message: err.message
        });
    }
};

exports.login = async (req, res) => {
    try {
        const user = await login(req.body);
        const token = jwt.sign(
            {
                id: user.id,
                role: user.role,
                username: user.username,
                email: user.email,
                phone: user.phone,
                image_url: user.image_url
            },
            process.env.JWT_SECRET,
            { expiresIn: "24h" }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 24 * 60 * 60 * 1000,
            path: "/",
        });

        return res.status(200).json({
            code: 200,
            status: "success",
            message: "User logged in successfully",
            data: {
                user: {
                    username: user.username,
                    email: user.email,
                    phone: user.phone,
                    image_url: user.image_url,
                    role: user.role
                },
            },
        });
    } catch (err) {
        return res.status(500).json({
            code: 500,
            status: "error",
            message: err.message,
        });
    }
};

exports.verifyToken = async (req, res) => {
    const token = req.cookies?.token;
    if (token) {
        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) {
                return res.status(403).json({
                    code: 403,
                    status: "error",
                    message: "Forbidden"
                });
            }
            return res.status(200).json({
                code: 200,
                status: "success",
                message: "Token verified successfully",
                data: { user }
            });
        });
    } else {
        return res.status(200).json({
            code: 200,
            status: "success",
            message: "No token found",
            data: null
        });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ code: 400, status: "error", message: "Email is required" });
        } 
        await forgotPassword(email);
        return res.status(200).json({
            code: 200,
            status: "success",
            message: "If the email exists, a reset link has been sent"
        });
    } catch (err) {
        return res.status(500).json({
            code: 500,
            status: "error",
            message: err.message,
            data: err
        });
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
        await resetPassword(token, password);
        return res.status(200).json({
            code: 200,
            status: "success",
            message: "Password reset successfully"
        });
    } catch (err) {
        if (err.message === 'Invalid or expired token') {
            return res.status(400).json({ code: 400, status: "error", message: err.message });
        }
        return res.status(500).json({ code: 500, status: "error", message: err.message });
    }
};

exports.registerCheckout = async (req, res) => {
    try {
        const result = await registerCheckout(req.body);
        return res.status(200).json({
            code: 200,
            status: "success",
            message: "User registered successfully",
            data: result
        });
    } catch (err) {
        return res.status(500).json({
            code: 500,
            status: "error",
            message: err.message,
            data: err
        });
    }
};

exports.getMe = async (req, res) => {
    const token = req.cookies?.token;
    if (!token) {
        return res.status(401).json({
            code: 401,
            status: "error",
            message: "Token not found"
        });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const query = `SELECT id, username, email, phone, image_url, role, created_at FROM users WHERE id = $1`;
        const { rows } = await db.query(query, [decoded.id]);
        if (rows.length === 0) {
            return res.status(404).json({
                code: 404,
                status: "error",
                message: "User not found"
            });
        }
        return res.status(200).json({
            code: 200,
            status: "success",
            data: rows[0]
        });
    } catch (err) {
        return res.status(401).json({
            code: 401,
            status: "error",
            message: "Invalid token"
        });
    }
};

exports.logout = async (req, res) => {
    res.cookie("token", "", {
        httpOnly: true,
        expires: new Date(0),
        path: "/"
    });
    return res.status(200).json({
        code: 200,
        status: "success",
        message: "Logged out successfully"
    });
};
