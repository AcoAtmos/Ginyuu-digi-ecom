const { db } = require("../../config/database");
const bcrypt = require('bcrypt');

exports.register = async (body) => {
    const { username, email, password, terms } = body;
    const query = `INSERT INTO users (username, email, password, terms) VALUES ($1, $2, $3, $4)`;
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
        await db.query(query, [username, email, hashedPassword, terms]);
        return;
    } catch (err) {
        throw new Error(err);
    }
};

exports.login = async (body) => {
    const { email, password } = body;
    const query = `SELECT * FROM users WHERE email = $1`;
    try {
        const { rows } = await db.query(query, [email]);
        const user = rows[0];
        if (!user) {
            throw new Error("User not found");
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new Error("Invalid password");
        }
        return {
            id: user.id,
            username: user.username,
            role: user.role || 'MEMBER',
            email: user.email,
            phone: user.phone,
            image_url: user.image_url
        };
    } catch (err) {
        throw new Error(err);
    }
};

exports.forgotPassword = async (email) => {
    const query = `SELECT id, username, email FROM users WHERE email = $1`;
    const { rows } = await db.query(query, [email]);
    if (rows.length === 0) {
        throw new Error("User not found");
    };

    const user = rows[0];
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
        { id: user.id, email: user.email, type: 'password_reset' },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
    );

    const { send_email } = require('../../shared/services/email.service');
    const resetLink = `${process.env.BASE_URL || process.env.BE_URL || `http://localhost:${process.env.PORT || 4100}`}/reset-password?token=${token}`;

    const html = `
        <div style="font-family:'DM Sans',Arial,sans-serif;max-width:560px;margin:0 auto;background:#111;border:1px solid #2a2a2a;border-radius:20px;padding:40px">
            <div style="text-align:center;margin-bottom:24px">
                <div style="font-family:Syne,sans-serif;font-size:24px;font-weight:800;color:#f0f0f0">GINYUU</div>
            </div>
            <div style="font-size:14px;color:#999;line-height:1.8">
                <p style="color:#f0f0f0;font-size:16px">Hi ${user.username},</p>
                <p>We received a request to reset your password. Click the button below to set a new password.</p>
                <p style="font-size:12px;color:#555">This link expires in 15 minutes.</p>
                <div style="text-align:center;margin:28px 0">
                    <a href="${resetLink}" style="display:inline-block;background:#fff;color:#0a0a0a;text-decoration:none;padding:12px 32px;border-radius:10px;font-weight:600;font-size:14px">Reset Password</a>
                </div>
                <p style="font-size:12px;color:#555">If you didn't request this, please ignore this email.</p>
            </div>
            <div style="border-top:1px solid #2a2a2a;margin-top:24px;padding-top:16px;font-size:11px;color:#555;text-align:center">
                Ginyuu Digital Product
            </div>
        </div>
    `;

    try {
        await send_email(user.email, 'Reset Your Password — Ginyuu', html);
    } catch (err) {
        console.error('Failed to send password reset email:', err);
    }
};

exports.resetPassword = async (token, newPassword) => {
    const jwt = require('jsonwebtoken');
    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        throw new Error('Invalid or expired token');
    }

    if (decoded.type !== 'password_reset') {
        throw new Error('Invalid token type');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const query = `UPDATE users SET password = $1 WHERE id = $2 RETURNING id`;
    const { rows } = await db.query(query, [hashedPassword, decoded.id]);

    if (rows.length === 0) {
        throw new Error('User not found');
    }
};

exports.registerCheckout = async (body) => {
    const { username, email, password, phone } = body;
    const query = `INSERT INTO users (username, email, password, phone) VALUES ($1, $2, $3, $4) RETURNING *`;
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
        const { rows } = await db.query(query, [username, email, hashedPassword, phone]);
        return rows[0];
    } catch (err) {
        throw new Error(err);
    }
};
