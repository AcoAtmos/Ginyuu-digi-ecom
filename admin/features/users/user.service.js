const { db } = require("../../config/db");
const bcrypt = require('bcrypt');

exports.getList = async ({ search, sort, page, limit }) => {
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10));
    const offset = (pageNum - 1) * limitNum;
    const orderDir = sort === 'asc' ? 'ASC' : 'DESC';
    const searchPattern = search && search.trim() ? `%${search.trim()}%` : null;

    const countQuery = `
        SELECT COUNT(*) FROM users
        WHERE ($1::text IS NULL OR username ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1)
    `;
    const countResult = await db.query(countQuery, [searchPattern]);
    const total = parseInt(countResult.rows[0].count);

    const dataQuery = `
        SELECT id, username, email, phone, image_url, role, created_at
        FROM users
        WHERE ($1::text IS NULL OR username ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1)
        ORDER BY created_at ${orderDir}
        LIMIT $2 OFFSET $3
    `;
    const { rows } = await db.query(dataQuery, [searchPattern, limitNum, offset]);

    return {
        success: true,
        data: rows,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum)
        }
    };
};

exports.getDetail = async (id) => {
    const query = `
        SELECT id, username, email, phone, image_url, role, created_at
        FROM users WHERE id = $1
    `;
    const { rows } = await db.query(query, [id]);
    if (rows.length === 0) return null;

    const orderCountQuery = `SELECT COUNT(*) as total_orders FROM orders WHERE user_id = $1`;
    const { rows: [orderCount] } = await db.query(orderCountQuery, [id]);

    return {
        ...rows[0],
        total_orders: parseInt(orderCount.total_orders)
    };
};

exports.create = async ({ username, email, password, phone }) => {
    const hashed = await bcrypt.hash(password, 10);
    const query = `
        INSERT INTO users (username, email, password, phone, role)
        VALUES ($1, $2, $3, $4, 'MEMBER')
        RETURNING id, username, email, phone, role, created_at
    `;
    const { rows } = await db.query(query, [username, email, hashed, phone || null]);
    return rows[0];
};

exports.update = async (id, fields) => {
    const allowed = ['username', 'email', 'phone', 'image_url', 'role'];
    const setClauses = [];
    const values = [];
    let idx = 1;

    for (const key of allowed) {
        if (fields[key] !== undefined) {
            setClauses.push(`${key} = $${idx++}`);
            values.push(fields[key]);
        }
    }

    if (setClauses.length === 0) {
        const { rows } = await db.query(`SELECT id, username, email, phone, image_url, role, created_at FROM users WHERE id = $1`, [id]);
        return rows[0] || null;
    }

    values.push(id);
    const query = `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING id, username, email, phone, image_url, role, created_at`;
    const { rows } = await db.query(query, values);
    return rows[0] || null;
};

exports.remove = async (id) => {
    const { rows } = await db.query(`SELECT id FROM users WHERE id = $1`, [id]);
    if (rows.length === 0) return false;
    await db.query(`DELETE FROM users WHERE id = $1`, [id]);
    return true;
};

exports.resetPassword = async (id, newPassword) => {
    const { rows } = await db.query(`SELECT id FROM users WHERE id = $1`, [id]);
    if (rows.length === 0) return null;

    const hashed = await bcrypt.hash(newPassword, 10);
    await db.query(`UPDATE users SET password = $1 WHERE id = $2`, [hashed, id]);
    return rows[0];
};
