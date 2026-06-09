const { db } = require("../../config/db");
const { eq, and } = require("drizzle-orm");
const { users } = require("../../../db/schema");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_SENDER,
        pass: process.env.EMAIL_PASSWORD
    }
});

const sendEmail = async (to, subject, html) => {
    await transporter.sendMail({
        from: `"Ginyuu Admin" <${process.env.EMAIL_SENDER}>`,
        to,
        subject,
        html
    });
};

exports.login = async ({ email, password }) => {
    const [user] = await db.select().from(users).where(eq(users.email, email));

    if (!user) {
        throw new Error("Invalid email or password");
    }

    if (user.role !== 'ADMIN') {
        throw new Error("Access denied. Admin only.");
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
        throw new Error("Invalid email or password");
    }

    return {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        image_url: user.imageUrl,
        role: user.role
    };
};

exports.forgotPassword = async (email) => {
    const rows = await db.select({ id: users.id, username: users.username, email: users.email, role: users.role }).from(users).where(eq(users.email, email));

    if (rows.length === 0 || rows[0].role !== 'ADMIN') {
        return;
    }

    const user = rows[0];
    const token = jwt.sign(
        { id: user.id, email: user.email, type: 'password_reset' },
        process.env.ADMIN_JWT_SECRET,
        { expiresIn: '15m' }
    );

    const resetLink = `${process.env.ADMIN_BASE_URL || `http://localhost:${process.env.ADMIN_PORT || 3100}`}/auth/reset-password/${token}`;
    const html = `
        <div style="font-family:'DM Sans',Arial,sans-serif;max-width:560px;margin:0 auto;background:#111;border:1px solid #2a2a2a;border-radius:20px;padding:40px">
            <div style="text-align:center;margin-bottom:24px">
                <div style="font-family:Syne,sans-serif;font-size:24px;font-weight:800;color:#f0f0f0">GINYUU ADMIN</div>
            </div>
            <div style="font-size:14px;color:#999;line-height:1.8">
                <p style="color:#f0f0f0;font-size:16px">Hi ${user.username},</p>
                <p>We received a request to reset your admin password. Click the button below to set a new password.</p>
                <p style="font-size:12px;color:#555">This link expires in 15 minutes.</p>
                <div style="text-align:center;margin:28px 0">
                    <a href="${resetLink}" style="display:inline-block;background:#fff;color:#0a0a0a;text-decoration:none;padding:12px 32px;border-radius:10px;font-weight:600;font-size:14px">Reset Password</a>
                </div>
                <p style="font-size:12px;color:#555">If you didn't request this, please ignore this email.</p>
            </div>
            <div style="border-top:1px solid #2a2a2a;margin-top:24px;padding-top:16px;font-size:11px;color:#555;text-align:center">
                Ginyuu Admin Panel
            </div>
        </div>
    `;

    try {
        await sendEmail(user.email, 'Reset Your Admin Password — Ginyuu', html);
    } catch (err) {
        console.error('Failed to send admin password reset email:', err);
    }
};

exports.resetPassword = async (token, newPassword) => {
    let decoded;
    try {
        decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
    } catch (err) {
        throw new Error('Invalid or expired token');
    }

    if (decoded.type !== 'password_reset') {
        throw new Error('Invalid token type');
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    const [result] = await db.update(users).set({ password: hashed }).where(and(eq(users.id, decoded.id), eq(users.role, 'ADMIN'))).returning({ id: users.id });

    if (!result) {
        throw new Error('User not found');
    }
};
