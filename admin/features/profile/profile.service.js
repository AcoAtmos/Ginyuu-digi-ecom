const { db } = require("../../config/db");
const { eq } = require("drizzle-orm");
const { users } = require("../../../db/schema");
const bcrypt = require('bcrypt');

exports.getProfile = async (userId) => {
    const [user] = await db.select({
        id: users.id, username: users.username, email: users.email,
        phone: users.phone, image_url: users.imageUrl, role: users.role,
        created_at: users.createdAt
    }).from(users).where(eq(users.id, userId));
    return user || null;
};

exports.changePassword = async (userId, currentPassword, newPassword) => {
    const [user] = await db.select({ password: users.password }).from(users).where(eq(users.id, userId));
    if (!user) {
        throw new Error("User not found");
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
        throw new Error("Current password is incorrect");
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await db.update(users).set({ password: hashed }).where(eq(users.id, userId));
};
