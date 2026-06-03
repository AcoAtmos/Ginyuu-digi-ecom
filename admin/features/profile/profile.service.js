const { db } = require("../../config/db");
const bcrypt = require('bcrypt');

exports.getProfile = async (userId) => {
    const query = `SELECT id, username, email, phone, image_url, role, created_at FROM users WHERE id = $1`;
    const { rows } = await db.query(query, [userId]);
    return rows[0] || null;
};

exports.changePassword = async (userId, currentPassword, newPassword) => {
    const { rows } = await db.query(`SELECT password FROM users WHERE id = $1`, [userId]);
    if (rows.length === 0) {
        throw new Error("User not found");
    }

    const isValid = await bcrypt.compare(currentPassword, rows[0].password);
    if (!isValid) {
        throw new Error("Current password is incorrect");
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await db.query(`UPDATE users SET password = $1 WHERE id = $2`, [hashed, userId]);
};
