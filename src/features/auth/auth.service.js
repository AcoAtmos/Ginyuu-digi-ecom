const { db } = require("../../../db");
const { users } = require("../../../db/schema");
const { eq } = require("drizzle-orm");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { normalizePhone } = require("../../shared/helpers/phone");

exports.register = async (body) => {
    const { username, email, password, terms } = body;
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
        const [inserted] = await db.insert(users).values({ username, email, password: hashedPassword, terms, status: 'inactive' }).returning({ id: users.id });

        const token = jwt.sign(
            { id: inserted.id, email, type: 'email_verification' },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        const baseUrl = process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 4100}`;
        const verifyLink = `${baseUrl}/api/auth/verify-email?token=${token}`;

        const { send_email } = require('../../shared/services/email.service');
        const html = `
            <div style="font-family:'DM Sans',Arial,sans-serif;max-width:560px;margin:0 auto;background:#111;border:1px solid #2a2a2a;border-radius:20px;padding:40px">
                <div style="text-align:center;margin-bottom:24px">
                    <div style="font-family:Syne,sans-serif;font-size:24px;font-weight:800;color:#f0f0f0">GINYUU</div>
                </div>
                <div style="font-size:14px;color:#999;line-height:1.8">
                    <p style="color:#f0f0f0;font-size:16px">Hi ${username},</p>
                    <p>Thank you for registering at GINYUU. Please verify your email address by clicking the button below.</p>
                    <p style="font-size:12px;color:#555">This link expires in 24 hours.</p>
                    <div style="text-align:center;margin:28px 0">
                        <a href="${verifyLink}" style="display:inline-block;background:#fff;color:#0a0a0a;text-decoration:none;padding:12px 32px;border-radius:10px;font-weight:600;font-size:14px">Verify Email</a>
                    </div>
                    <p style="font-size:12px;color:#555">If you didn't register, please ignore this email.</p>
                </div>
                <div style="border-top:1px solid #2a2a2a;margin-top:24px;padding-top:16px;font-size:11px;color:#555;text-align:center">
                    Ginyuu Digital Product
                </div>
            </div>
        `;

        try {
            await send_email(email, 'Verify Your Email — GINYUU', html);
        } catch (err) {
            console.error('Failed to send verification email:', err);
        }

        return;
    } catch (err) {
        throw new Error(err);
    }
};

exports.verifyEmail = async (token) => {
    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        throw new Error('Invalid or expired verification link');
    }

    if (decoded.type !== 'email_verification') {
        throw new Error('Invalid token type');
    }

    const [user] = await db.update(users).set({ status: 'active' }).where(eq(users.id, decoded.id)).returning({ id: users.id });

    if (!user) {
        throw new Error('User not found');
    }
};

exports.resendVerification = async (email) => {
    const [user] = await db.select({ id: users.id, username: users.username, status: users.status }).from(users).where(eq(users.email, email));

    if (!user || user.status !== 'inactive') {
        return;
    }

    const token = jwt.sign(
        { id: user.id, email, type: 'email_verification' },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );

    const baseUrl = process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 4100}`;
    const verifyLink = `${baseUrl}/api/auth/verify-email?token=${token}`;

    const { send_email } = require('../../shared/services/email.service');
    const html = `
        <div style="font-family:'DM Sans',Arial,sans-serif;max-width:560px;margin:0 auto;background:#111;border:1px solid #2a2a2a;border-radius:20px;padding:40px">
            <div style="text-align:center;margin-bottom:24px">
                <div style="font-family:Syne,sans-serif;font-size:24px;font-weight:800;color:#f0f0f0">GINYUU</div>
            </div>
            <div style="font-size:14px;color:#999;line-height:1.8">
                <p style="color:#f0f0f0;font-size:16px">Hi ${user.username},</p>
                <p>Here is your new verification link. Please verify your email address by clicking the button below.</p>
                <p style="font-size:12px;color:#555">This link expires in 24 hours.</p>
                <div style="text-align:center;margin:28px 0">
                    <a href="${verifyLink}" style="display:inline-block;background:#fff;color:#0a0a0a;text-decoration:none;padding:12px 32px;border-radius:10px;font-weight:600;font-size:14px">Verify Email</a>
                </div>
            </div>
            <div style="border-top:1px solid #2a2a2a;margin-top:24px;padding-top:16px;font-size:11px;color:#555;text-align:center">
                Ginyuu Digital Product
            </div>
        </div>
    `;

    try {
        await send_email(email, 'Verify Your Email — GINYUU', html);
    } catch (err) {
        console.error('Failed to send verification email:', err);
    }
};

exports.login = async (body) => {
    const { email, password } = body;
    try {
        const [user] = await db.select().from(users).where(eq(users.email, email));
        if (!user) {
            throw new Error("User not found");
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new Error("Invalid password");
        }
        if (user.status !== 'active') {
            throw new Error("Email not verified. Please check your email or resend verification.");
        }
        return {
            id: user.id,
            username: user.username,
            role: user.role || 'MEMBER',
            email: user.email,
            phone: user.phone,
            image_url: user.imageUrl
        };
    } catch (err) {
        throw new Error(err);
    }
};

exports.forgotPassword = async (email) => {
    const [user] = await db.select({ id: users.id, username: users.username, email: users.email }).from(users).where(eq(users.email, email));
    if (!user) {
        throw new Error("User not found");
    };

    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
        {   id: user.id, 
            email: user.email, 
            type: 'password_reset' 
        },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
    );

    const { send_email } = require('../../shared/services/email.service');
    const resetLink = `${process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 4100}`}/reset-password?token=${token}`;

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
    const [user] = await db.update(users).set({ password: hashedPassword }).where(eq(users.id, decoded.id)).returning({ id: users.id });

    if (!user) {
        throw new Error('User not found');
    }
};

exports.registerCheckout = async (body) => {
    const { username, email, password, phone } = body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const normalizedPhone = normalizePhone(phone);
    try {
        const [inserted] = await db.insert(users).values({ username, email, password: hashedPassword, phone: normalizedPhone, status: 'active' }).returning();
        return inserted;
    } catch (err) {
        throw new Error(err);
    }
};

exports.verifyEmailChange = async (token) => {
    const jwt = require('jsonwebtoken');
    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        throw new Error('Invalid or expired verification link');
    }

    if (decoded.type !== 'email_change') {
        throw new Error('Invalid token type');
    }

    const [user] = await db.update(users).set({ email: decoded.new_email }).where(eq(users.id, decoded.id)).returning({ id: users.id });

    if (!user) {
        throw new Error('User not found');
    }
};
